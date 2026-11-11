export function getDatabaseEnvironment(args) {
  if (args.local && args.production) {
    throw new Error("Use apenas um dos flags: --local ou --production.")
  }
  return {
    environmentFile: args.production ? ".env" : ".env.local",
    environment: args.production ? "produção" : "local",
    environmentFlag: args.production
      ? " --production"
      : args.local
        ? " --local"
        : "",
  }
}
