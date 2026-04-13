import type { BlockInteraction, BlockResponse, FlareActionHandler, PluginContext } from './types';

interface SchemaWithSafeParse<TOut = any> {
  safeParse: (data: unknown) => { success: true; data: TOut } | { success: false; error: any };
}

export class ActionBuilder<TInput = unknown> {
  private schema?: SchemaWithSafeParse<TInput>;

  /**
   * Defines a validation schema for the interaction values (e.g., using Zod for form submits).
   */
  input<T>(schema: SchemaWithSafeParse<T>): ActionBuilder<T> {
    this.schema = schema as any;
    return this as any;
  }

  /**
   * Sets the handler for the action.
   */
  handler(fn: (interaction: BlockInteraction & { input: TInput }, ctx: PluginContext) => Promise<BlockResponse> | BlockResponse): FlareActionHandler {
    return async (interaction, ctx) => {
      let inputData: any = {};

      if (interaction.type === 'form_submit') {
        inputData = interaction.values;
      } else if (interaction.type === 'block_action') {
        inputData = interaction.value;
      }

      if (this.schema) {
        const result = this.schema.safeParse(inputData);
        if (!result.success) {
          // Return an automatic toast error for validation failures
          return {
            blocks: [],
            toast: {
              type: 'error',
              message: 'Validation failed. Please check your inputs.',
            }
          };
        }
        inputData = result.data;
      }

      return fn({ ...interaction, input: inputData as TInput }, ctx);
    };
  }
}

/**
 * Action builder for defining UI interactions and form handlers.
 */
export const action = {
  /**
   * Starts an action definition
   */
  define: () => new ActionBuilder(),
};
