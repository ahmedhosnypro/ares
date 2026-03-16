#!/bin/bash
# backend.sh - interactive backend management via fzf

# Match the working script, drop the strict -uo pipefail
set -e

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/backend"
INFRA_PROJ="$BACKEND_DIR/Infrastructure/Infrastructure.csproj"
API_PROJ="$BACKEND_DIR/Api/Api.csproj"
SOLUTION="$BACKEND_DIR/Ares.slnx"
EF_ARGS="--project $INFRA_PROJ --startup-project $API_PROJ"
ENV_FILE="$BACKEND_DIR/.env"
SELECT_PLAIN_MENU_RESULT=""

# ── .env loader ────────────────────────────────────────────────────────────────

load_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "No .env found at $ENV_FILE"
    read -rp "Create one from .env.example now? [Y/n] " yn
    if [[ "${yn,,}" != "n" ]]; then
      cp "$BACKEND_DIR/.env.example" "$ENV_FILE"
      echo "Created $ENV_FILE - edit it with your values, then re-run."
      exit 0
    fi
    echo "Continuing without .env (using appsettings.json values)."
    return
  fi

  # Export each non-comment, non-empty line as an env var.
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line//$'\r'/}"
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val#\"}" ; val="${val%\"}"
    val="${val#\'}" ; val="${val%\'}"
    export "$key=$val"
  done < "$ENV_FILE"
}

# ── helpers ────────────────────────────────────────────────────────────────────

is_interactive_terminal() {
  [[ -t 0 && -t 1 ]]
}

header() {
  echo ""
  echo "  ╔══════════════════════════════════╗"
  echo "  ║     Ares Backend Manager         ║"
  echo "  ╚══════════════════════════════════╝"
  echo ""
}

run_with_label() {
  local label="$1"; shift
  echo "▶ $label"
  echo "──────────────────────────────────────"
  local output_file
  output_file="$(mktemp)"

  "$@" >"$output_file" 2>&1 &
  local cmd_pid=$!
  local exit_code=0
  local last_size=0
  local last_output_at
  last_output_at=$(date +%s)
  local now

  while kill -0 "$cmd_pid" >/dev/null 2>&1; do
    local current_size
    current_size=$(wc -c < "$output_file" 2>/dev/null || echo 0)

    if (( current_size > last_size )); then
      tail -c +$((last_size + 1)) "$output_file"
      last_size=$current_size
      last_output_at=$(date +%s)
    else
      now=$(date +%s)
      if (( now - last_output_at >= 3 )); then
        echo "… still working ($label)"
        last_output_at=$now
      fi
    fi

    sleep 0.2
  done

  wait "$cmd_pid" || exit_code=$?

  local final_size
  final_size=$(wc -c < "$output_file" 2>/dev/null || echo 0)
  if (( final_size > last_size )); then
    tail -c +$((last_size + 1)) "$output_file"
  fi

  rm -f "$output_file"

  echo "──────────────────────────────────────"
  if [[ "$exit_code" -eq 0 ]]; then
    echo "✔ Done"
  else
    echo "✗ Failed (exit code: $exit_code)"
    return "$exit_code"
  fi
}

ensure_db_host_resolves() {
  local conn host
  conn="${ConnectionStrings__DefaultConnection:-}"

  [[ -z "$conn" ]] && return 0

  host=$(echo "$conn" | sed -n 's/.*Server=\([^,;]*\).*/\1/p')
  [[ -z "$host" ]] && return 0

  # Local aliases always resolve and don't need DNS lookup.
  if [[ "$host" == "localhost" || "$host" == "127.0.0.1" || "$host" == "." ]]; then
    return 0
  fi

  if ! getent hosts "$host" >/dev/null 2>&1; then
    echo "Database host '$host' is not resolvable from this environment."
    echo "Update $ENV_FILE and set ConnectionStrings__DefaultConnection accordingly:"
    echo "  - Use Server=mssql,1433 inside the devcontainer"
    echo "  - Use Server=localhost,1433 outside the devcontainer"
    return 1
  fi
}

print_usage() {
  cat <<'EOF'
Usage:
  scripts/backend.sh [command] [options]

Commands:
  menu
      Open interactive menu (number/letter selection).

  build
      Build the backend solution.

  run
      Run the API project.

  migrate add --name <MigrationName>
  migrate update [--target <MigrationName|0|latest>]
  migrate list
  migrate remove

  db drop [--yes]

  help

Examples:
  scripts/backend.sh build
  scripts/backend.sh migrate add --name AddBookingIndexes
  scripts/backend.sh migrate update --target latest
  scripts/backend.sh db drop --yes
  scripts/backend.sh menu
EOF
}

select_plain_menu() {
  local title="$1"
  shift
  local options=("$@")
  local i max_letter input input_lc idx ascii

  SELECT_PLAIN_MENU_RESULT=""

  if ! is_interactive_terminal; then
    echo "Interactive selection requires a terminal (TTY)." >&2
    return 1
  fi

  echo "$title"
  for i in "${!options[@]}"; do
    if (( i < 26 )); then
      printf "  %2d) [%s] %s\n" "$((i + 1))" "$(printf "\\$(printf '%03o' $((97 + i)))")" "${options[$i]}"
    else
      printf "  %2d) %s\n" "$((i + 1))" "${options[$i]}"
    fi
  done

  if (( ${#options[@]} <= 26 )); then
    max_letter="$(printf "\\$(printf '%03o' $((96 + ${#options[@]})))")"
    echo "Choose by number (1-${#options[@]}) or letter (a-${max_letter})."
  else
    echo "Choose by number (1-${#options[@]})."
  fi

  while true; do
    read -rp "Choice: " input
    input_lc="${input,,}"

    if [[ "$input_lc" =~ ^[0-9]+$ ]] && (( input_lc >= 1 && input_lc <= ${#options[@]} )); then
      SELECT_PLAIN_MENU_RESULT="${options[$((input_lc - 1))]}"
      return 0
    fi

    if [[ "$input_lc" =~ ^[a-z]$ && ${#options[@]} -le 26 ]]; then
      ascii=$(printf '%d' "'$input_lc")
      idx=$((ascii - 97))
      if (( idx >= 0 && idx < ${#options[@]} )); then
        SELECT_PLAIN_MENU_RESULT="${options[$idx]}"
        return 0
      fi
    fi

    echo "Invalid choice. Try again."
  done
}

# ── actions ────────────────────────────────────────────────────────────────────

action_build() {
  run_with_label "Building solution" dotnet build "$SOLUTION"
}

action_run() {
  echo "▶ Running API (Ctrl+C to stop)"
  echo "──────────────────────────────────────"
  dotnet run --project "$API_PROJ"
}

action_migrate_add() {
  ensure_db_host_resolves || return 1
  local name="${1:-}"
  if [[ -z "$name" ]]; then
    if ! is_interactive_terminal; then
      echo "Migration name is required in non-interactive mode. Use: migrate add --name <MigrationName>"
      return 1
    fi
    read -rp "Migration name: " name
  fi
  [[ -z "$name" ]] && { echo "Aborted - no name provided."; return; }
  run_with_label "Adding migration: $name" \
    dotnet ef migrations add "$name" $EF_ARGS
}

action_migrate_update() {
  ensure_db_host_resolves || return 1
  local selected_target="${1:-}"
  local migrations_raw migrations
  migrations_raw=$(dotnet ef migrations list $EF_ARGS --no-connect 2>/dev/null || true)
  migrations=$(printf "%s\n" "$migrations_raw" \
    | grep -E '^[0-9]{14}_[A-Za-z0-9_]+$' || true)

  local target_options=("latest (HEAD)" "0 (rollback all)")
  if [[ -n "$migrations" ]]; then
    while IFS= read -r m; do
      [[ -n "$m" ]] && target_options+=("$m")
    done <<< "$migrations"
  fi

  local target
  if [[ -n "$selected_target" ]]; then
    case "${selected_target,,}" in
      latest|head)
        target="latest (HEAD)"
        ;;
      rollback|zero|0)
        target="0 (rollback all)"
        ;;
      *)
        target="$selected_target"
        ;;
    esac
  elif is_interactive_terminal; then
    select_plain_menu "Migration targets:" "${target_options[@]}" || return 1
    target="$SELECT_PLAIN_MENU_RESULT"
  else
    target="latest (HEAD)"
  fi

  [[ -z "$target" ]] && { echo "Aborted."; return; }

  if [[ "$target" == "latest (HEAD)" ]]; then
    run_with_label "Updating database to latest" \
      dotnet ef database update $EF_ARGS
  else
    local name
    name=$(echo "$target" | awk '{print $1}')
    run_with_label "Updating database to: $name" \
      dotnet ef database update "$name" $EF_ARGS
  fi
}

action_migrate_list() {
  ensure_db_host_resolves || return 1
  run_with_label "Listing migrations" \
    dotnet ef migrations list $EF_ARGS --no-connect
}

action_migrate_remove() {
  run_with_label "Removing last migration" \
    dotnet ef migrations remove $EF_ARGS
}

action_db_drop() {
  ensure_db_host_resolves || return 1
  local force="${1:-}"
  local confirm
  if [[ "$force" != "yes" ]]; then
    if ! is_interactive_terminal; then
      echo "Refusing to drop database in non-interactive mode without --yes."
      return 1
    fi

    select_plain_menu "Confirm database drop (destructive):" \
      "yes - Drop the database" \
      "no  - Cancel" || return 1
    confirm="$SELECT_PLAIN_MENU_RESULT"

    if [[ "$confirm" != yes* ]]; then
      echo "Aborted."
      return
    fi
  fi
  run_with_label "Dropping database" \
    dotnet ef database drop --force $EF_ARGS
}

# ── menu ───────────────────────────────────────────────────────────────────────

MENU=(
  "build          - Build the solution"
  "run            - Run the API"
  "migrate add    - Add a new migration"
  "migrate update - Apply migrations to the database"
  "migrate list   - List all migrations"
  "migrate remove - Remove the last migration"
  "db drop        - Drop the database"
  "quit           - Exit"
)

main() {
  load_env
  local command="${1:-menu}"

  case "$command" in
    help|-h|--help)
      print_usage
      ;;

    menu)
      header
      while true; do
        local choice
        if ! select_plain_menu "Actions:" "${MENU[@]}"; then
          echo "Menu mode requires an interactive terminal." >&2
          echo "Use command mode instead (e.g. scripts/backend.sh build)." >&2
          exit 1
        fi
        choice="$SELECT_PLAIN_MENU_RESULT"

        if [[ -z "$choice" || "$choice" == quit* ]]; then
          echo "Bye."
          exit 0
        fi

        set +e
        case "$choice" in
          build*)            action_build ;;
          run*)              action_run ;;
          "migrate add"*)   action_migrate_add ;;
          "migrate update"*) action_migrate_update ;;
          "migrate list"*)  action_migrate_list ;;
          "migrate remove"*) action_migrate_remove ;;
          "db drop"*)       action_db_drop ;;
        esac
        exit_code=$?
        set -e

        echo ""
        if [[ "$exit_code" -ne 0 ]]; then
          echo "✗ Command failed with exit code: $exit_code"
        fi

        read -rp "Press Enter to return to menu..."
      done
      ;;

    build)
      action_build
      ;;

    run)
      action_run
      ;;

    migrate)
      local subcommand="${2:-}"
      case "$subcommand" in
        add)
          local name=""
          shift 2
          while [[ $# -gt 0 ]]; do
            case "$1" in
              --name|-n)
                shift
                name="${1:-}"
                ;;
              *)
                echo "Unknown option for migrate add: $1"
                print_usage
                exit 1
                ;;
            esac
            shift
          done
          action_migrate_add "$name"
          ;;

        update)
          local target=""
          shift 2
          while [[ $# -gt 0 ]]; do
            case "$1" in
              --target|-t)
                shift
                target="${1:-}"
                ;;
              --latest)
                target="latest"
                ;;
              *)
                echo "Unknown option for migrate update: $1"
                print_usage
                exit 1
                ;;
            esac
            shift
          done
          action_migrate_update "$target"
          ;;

        list)
          action_migrate_list
          ;;

        remove)
          action_migrate_remove
          ;;

        *)
          echo "Unknown migrate subcommand: ${subcommand:-<empty>}"
          print_usage
          exit 1
          ;;
      esac
      ;;

    db)
      local subcommand="${2:-}"
      case "$subcommand" in
        drop)
          local force=""
          shift 2
          while [[ $# -gt 0 ]]; do
            case "$1" in
              --yes|-y)
                force="yes"
                ;;
              *)
                echo "Unknown option for db drop: $1"
                print_usage
                exit 1
                ;;
            esac
            shift
          done
          action_db_drop "$force"
          ;;
        *)
          echo "Unknown db subcommand: ${subcommand:-<empty>}"
          print_usage
          exit 1
          ;;
      esac
      ;;

    *)
      echo "Unknown command: $command"
      print_usage
      exit 1
      ;;
  esac
}

main "$@"