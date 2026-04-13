export namespace JSX {
  export type Element = any;
  export type ElementClass = any;
  export interface IntrinsicElements {
    [elemName: string]: any;
  }
  export interface ElementAttributesProperty { props: {}; }
  export interface ElementChildrenAttribute { children: {}; }
}

export function jsx(type: any, props: any, key?: any): any {
  return {
    type,
    props,
    key
  };
}

export const jsxs = jsx;
export const jsxDEV = jsx;

export function Fragment(props: any): any {
  return props.children;
}
