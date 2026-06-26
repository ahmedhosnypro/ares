import type { MessageSchema } from "./types/message";
import common from "./ar/common";
import auth from "./ar/auth";
import errors from "./ar/errors";

const ar: MessageSchema = {
  common,
  auth,
  errors,
};

export default ar;
