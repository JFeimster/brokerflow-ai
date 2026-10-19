import { publicError } from "./errors.js";
export function result(value) {
  return {
    structuredContent: value,
    content: [{ type: "text", text: JSON.stringify(value) }],
  };
}

export function registerTool(server, name, config, handler) {
  server.registerTool(name, config, async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return publicError(error);
    }
  });
}
