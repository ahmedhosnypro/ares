import type { MessageSchema } from "./types/message";
import common from "./en/common";
import auth from "./en/auth";
import errors from "./en/errors";

const en: MessageSchema = {
  common,
  auth,
  errors,
};

export default en;
