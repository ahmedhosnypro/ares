import type { AuthLabels } from "./auth";
import type { CommonLabels } from "./common";
import type { ErrorsLabels } from "./errors";

export type { AuthLabels, CommonLabels, ErrorsLabels };

export type MessageSchema = {
  readonly common: CommonLabels;
  readonly auth: AuthLabels;
  readonly errors: ErrorsLabels;
};
