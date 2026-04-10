declare module "cloudflare:workers" {
  /**
   * WorkerEntrypoint is the base class for Cloudflare Workers RPC Entrypoints.
   */
  export class WorkerEntrypoint<Env = any> {
    constructor(ctx: any, env: Env);
    readonly env: Env;
    readonly ctx: any;
  }
}
