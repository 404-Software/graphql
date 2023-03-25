import * as CustomTypes from '../scalar-types' /* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const';


export const HOST="Specify host"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

export const Thunder =
  (fn: FetchFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions & { variables?: Record<string, unknown> }) =>
    fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (graphqlOptions?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: graphqlOptions.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, SCLR>>;

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  (fn: SubscriptionFunction) =>
  <O extends keyof typeof Ops, SCLR extends ScalarDefinition, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<SCLR>,
  ) =>
  <Z extends ValueTypes[R]>(o: Z | ValueTypes[R], ops?: OperationOptions & { variables?: ExtractVariables<Z> }) => {
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: graphqlOptions?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], SCLR>;
    if (returnedFunction?.on && graphqlOptions?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, SCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, SCLR>) => {
          if (graphqlOptions?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: graphqlOptions.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z | ValueTypes[R],
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : never, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <T>(t: T | V) => T;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariables<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = never
export type ScalarCoders = {
	Upload?: ScalarResolver;
	Date?: ScalarResolver;
	Null?: ScalarResolver;
	NullableString?: ScalarResolver;
	NullableNumber?: ScalarResolver;
	NullableID?: ScalarResolver;
	UntrimmedString?: ScalarResolver;
	LowercaseString?: ScalarResolver;
	UppercaseString?: ScalarResolver;
	EmailAddress?: ScalarResolver;
	Password?: ScalarResolver;
	OTP?: ScalarResolver;
	PhoneNumber?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Authentication"]: AliasType<{
	user?:ValueTypes["User"],
	token?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginInput"]: {
	email: ValueTypes["EmailAddress"] | Variable<any, string>,
	password: string | Variable<any, string>
};
	["CheckEmailInput"]: {
	email: ValueTypes["EmailAddress"] | Variable<any, string>
};
	["RefreshTokenInput"]: {
	token: string | Variable<any, string>
};
	["RegistrationInput"]: {
	name: string | Variable<any, string>,
	email: ValueTypes["EmailAddress"] | Variable<any, string>,
	password: ValueTypes["Password"] | Variable<any, string>
};
	["RequestPasswordResetInput"]: {
	email: ValueTypes["EmailAddress"] | Variable<any, string>
};
	["ResetPasswordInput"]: {
	token: string | Variable<any, string>,
	password: ValueTypes["Password"] | Variable<any, string>
};
	["Query"]: AliasType<{
	_empty?:boolean | `@${string}`,
login?: [{	data: ValueTypes["LoginInput"] | Variable<any, string>},ValueTypes["Authentication"]],
checkEmail?: [{	data: ValueTypes["CheckEmailInput"] | Variable<any, string>},boolean | `@${string}`],
refreshToken?: [{	data: ValueTypes["RefreshTokenInput"] | Variable<any, string>},ValueTypes["Authentication"]],
	myUser?:ValueTypes["User"],
user?: [{	where: ValueTypes["UserWhereUniqueInput"] | Variable<any, string>},ValueTypes["User"]],
users?: [{	where?: ValueTypes["UserWhereInput"] | undefined | null | Variable<any, string>,	orderBy?: Array<ValueTypes["UserOrderByInput"]> | undefined | null | Variable<any, string>,	take?: number | undefined | null | Variable<any, string>,	skip?: number | undefined | null | Variable<any, string>},ValueTypes["User"]],
usersCount?: [{	where?: ValueTypes["UserWhereInput"] | undefined | null | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	_empty?:boolean | `@${string}`,
register?: [{	data: ValueTypes["RegistrationInput"] | Variable<any, string>},ValueTypes["Authentication"]],
requestPasswordReset?: [{	data: ValueTypes["RequestPasswordResetInput"] | Variable<any, string>},boolean | `@${string}`],
resetPassword?: [{	data: ValueTypes["ResetPasswordInput"] | Variable<any, string>},ValueTypes["Authentication"]],
createUser?: [{	data: ValueTypes["UserCreateInput"] | Variable<any, string>},ValueTypes["User"]],
updateMyUser?: [{	data: ValueTypes["MyUserUpdateInput"] | Variable<any, string>},ValueTypes["User"]],
updateUser?: [{	where: ValueTypes["UserWhereUniqueInput"] | Variable<any, string>,	data: ValueTypes["UserUpdateInput"] | Variable<any, string>},ValueTypes["User"]],
deleteUser?: [{	where: ValueTypes["UserWhereUniqueInput"] | Variable<any, string>},ValueTypes["User"]],
		__typename?: boolean | `@${string}`
}>;
	["IDFilter"]: {
	equals?: string | undefined | null | Variable<any, string>,
	in?: Array<string> | undefined | null | Variable<any, string>,
	notIn?: Array<string> | undefined | null | Variable<any, string>,
	lt?: string | undefined | null | Variable<any, string>,
	lte?: string | undefined | null | Variable<any, string>,
	gt?: string | undefined | null | Variable<any, string>,
	gte?: string | undefined | null | Variable<any, string>,
	not?: ValueTypes["IDFilter"] | undefined | null | Variable<any, string>
};
	["RelationshipNullableFilter"]: {
	id?: string | undefined | null | Variable<any, string>,
	is?: ValueTypes["Null"] | undefined | null | Variable<any, string>,
	isNot?: ValueTypes["Null"] | undefined | null | Variable<any, string>
};
	["ArrayNullableFilter"]: {
	equals?: Array<string> | undefined | null | Variable<any, string>,
	hasSome?: Array<string> | undefined | null | Variable<any, string>,
	hasEvery?: Array<string> | undefined | null | Variable<any, string>,
	has?: string | undefined | null | Variable<any, string>,
	isEmpty?: boolean | undefined | null | Variable<any, string>
};
	["StringNullableFilter"]: {
	equals?: string | undefined | null | Variable<any, string>,
	in?: Array<string> | undefined | null | Variable<any, string>,
	notIn?: Array<string> | undefined | null | Variable<any, string>,
	lt?: string | undefined | null | Variable<any, string>,
	lte?: string | undefined | null | Variable<any, string>,
	gt?: string | undefined | null | Variable<any, string>,
	gte?: string | undefined | null | Variable<any, string>,
	contains?: string | undefined | null | Variable<any, string>,
	startsWith?: string | undefined | null | Variable<any, string>,
	endsWith?: string | undefined | null | Variable<any, string>,
	mode?: ValueTypes["QueryMode"] | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedStringNullableFilter"] | undefined | null | Variable<any, string>
};
	["NestedStringNullableFilter"]: {
	equals?: string | undefined | null | Variable<any, string>,
	in?: Array<string> | undefined | null | Variable<any, string>,
	notIn?: Array<string> | undefined | null | Variable<any, string>,
	lt?: string | undefined | null | Variable<any, string>,
	lte?: string | undefined | null | Variable<any, string>,
	gt?: string | undefined | null | Variable<any, string>,
	gte?: string | undefined | null | Variable<any, string>,
	contains?: string | undefined | null | Variable<any, string>,
	startsWith?: string | undefined | null | Variable<any, string>,
	endsWith?: string | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedStringNullableFilter"] | undefined | null | Variable<any, string>
};
	["IntNullableFilter"]: {
	equals?: number | undefined | null | Variable<any, string>,
	in?: Array<number> | undefined | null | Variable<any, string>,
	notIn?: Array<number> | undefined | null | Variable<any, string>,
	lt?: number | undefined | null | Variable<any, string>,
	lte?: number | undefined | null | Variable<any, string>,
	gt?: number | undefined | null | Variable<any, string>,
	gte?: number | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedIntNullableFilter"] | undefined | null | Variable<any, string>
};
	["NestedIntNullableFilter"]: {
	equals?: number | undefined | null | Variable<any, string>,
	in?: Array<number> | undefined | null | Variable<any, string>,
	notIn?: Array<number> | undefined | null | Variable<any, string>,
	lt?: number | undefined | null | Variable<any, string>,
	lte?: number | undefined | null | Variable<any, string>,
	gt?: number | undefined | null | Variable<any, string>,
	gte?: number | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedIntNullableFilter"] | undefined | null | Variable<any, string>
};
	["FloatNullableFilter"]: {
	equals?: number | undefined | null | Variable<any, string>,
	in?: Array<number> | undefined | null | Variable<any, string>,
	notIn?: Array<number> | undefined | null | Variable<any, string>,
	lt?: number | undefined | null | Variable<any, string>,
	lte?: number | undefined | null | Variable<any, string>,
	gt?: number | undefined | null | Variable<any, string>,
	gte?: number | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedFloatNullableFilter"] | undefined | null | Variable<any, string>
};
	["NestedFloatNullableFilter"]: {
	equals?: number | undefined | null | Variable<any, string>,
	in?: Array<number> | undefined | null | Variable<any, string>,
	notIn?: Array<number> | undefined | null | Variable<any, string>,
	lt?: number | undefined | null | Variable<any, string>,
	lte?: number | undefined | null | Variable<any, string>,
	gt?: number | undefined | null | Variable<any, string>,
	gte?: number | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedFloatNullableFilter"] | undefined | null | Variable<any, string>
};
	["BooleanNullableFilter"]: {
	equals?: boolean | undefined | null | Variable<any, string>,
	not?: boolean | undefined | null | Variable<any, string>
};
	["NestedBooleanNullableFilter"]: {
	equals?: boolean | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedBooleanNullableFilter"] | undefined | null | Variable<any, string>
};
	["DateNullableFilter"]: {
	equals?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	gt?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	gte?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	in?: Array<ValueTypes["Date"]> | undefined | null | Variable<any, string>,
	lt?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	lte?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	not?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	notIn?: Array<ValueTypes["Date"]> | undefined | null | Variable<any, string>
};
	["NestedDateNullableFilter"]: {
	equals?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	in?: Array<ValueTypes["Date"]> | undefined | null | Variable<any, string>,
	notIn?: Array<ValueTypes["Date"]> | undefined | null | Variable<any, string>,
	lt?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	lte?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	gt?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	gte?: ValueTypes["Date"] | undefined | null | Variable<any, string>,
	not?: ValueTypes["NestedDateNullableFilter"] | undefined | null | Variable<any, string>
};
	["QueryMode"]:QueryMode;
	["OrderDirection"]:OrderDirection;
	["BatchPayload"]: AliasType<{
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Gender"]:Gender;
	["MessageResponse"]: AliasType<{
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Upload"]: CustomTypes.File;
	["Date"]: Date;
	["Null"]: null | undefined;
	["NullableString"]: null | string;
	["NullableNumber"]: null | number;
	["NullableID"]: null | string;
	["UntrimmedString"]: string;
	["LowercaseString"]: string;
	["UppercaseString"]: string;
	["EmailAddress"]: string;
	["Password"]: string;
	["OTP"]: string;
	["PhoneNumber"]: string;
	["UserRole"]:UserRole;
	["User"]: AliasType<{
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UserWhereUniqueInput"]: {
	id?: string | undefined | null | Variable<any, string>,
	email?: string | undefined | null | Variable<any, string>
};
	["UserRoleNullableFilter"]: {
	equals?: ValueTypes["UserRole"] | undefined | null | Variable<any, string>,
	in?: Array<ValueTypes["UserRole"]> | undefined | null | Variable<any, string>,
	notIn?: Array<ValueTypes["UserRole"]> | undefined | null | Variable<any, string>
};
	["UserWhereInput"]: {
	AND?: Array<ValueTypes["UserWhereInput"]> | undefined | null | Variable<any, string>,
	OR?: Array<ValueTypes["UserWhereInput"]> | undefined | null | Variable<any, string>,
	NOT?: Array<ValueTypes["UserWhereInput"]> | undefined | null | Variable<any, string>,
	id?: ValueTypes["IDFilter"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["StringNullableFilter"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["StringNullableFilter"] | undefined | null | Variable<any, string>,
	role?: ValueTypes["UserRoleNullableFilter"] | undefined | null | Variable<any, string>
};
	["UserCreateInput"]: {
	name: string | Variable<any, string>,
	email: string | Variable<any, string>,
	password: ValueTypes["Password"] | Variable<any, string>,
	role?: ValueTypes["UserRole"] | undefined | null | Variable<any, string>
};
	["UserUpdateInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	email?: string | undefined | null | Variable<any, string>,
	password?: ValueTypes["Password"] | undefined | null | Variable<any, string>,
	role?: ValueTypes["UserRole"] | undefined | null | Variable<any, string>
};
	["MyUserUpdateInput"]: {
	name?: string | undefined | null | Variable<any, string>,
	email?: string | undefined | null | Variable<any, string>
};
	["UserOrderByInput"]: {
	id?: ValueTypes["OrderDirection"] | undefined | null | Variable<any, string>,
	name?: ValueTypes["OrderDirection"] | undefined | null | Variable<any, string>,
	email?: ValueTypes["OrderDirection"] | undefined | null | Variable<any, string>,
	role?: ValueTypes["OrderDirection"] | undefined | null | Variable<any, string>,
	createdAt?: ValueTypes["OrderDirection"] | undefined | null | Variable<any, string>
}
  }

export type ResolverInputTypes = {
    ["Authentication"]: AliasType<{
	user?:ResolverInputTypes["User"],
	token?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginInput"]: {
	email: ResolverInputTypes["EmailAddress"],
	password: string
};
	["CheckEmailInput"]: {
	email: ResolverInputTypes["EmailAddress"]
};
	["RefreshTokenInput"]: {
	token: string
};
	["RegistrationInput"]: {
	name: string,
	email: ResolverInputTypes["EmailAddress"],
	password: ResolverInputTypes["Password"]
};
	["RequestPasswordResetInput"]: {
	email: ResolverInputTypes["EmailAddress"]
};
	["ResetPasswordInput"]: {
	token: string,
	password: ResolverInputTypes["Password"]
};
	["Query"]: AliasType<{
	_empty?:boolean | `@${string}`,
login?: [{	data: ResolverInputTypes["LoginInput"]},ResolverInputTypes["Authentication"]],
checkEmail?: [{	data: ResolverInputTypes["CheckEmailInput"]},boolean | `@${string}`],
refreshToken?: [{	data: ResolverInputTypes["RefreshTokenInput"]},ResolverInputTypes["Authentication"]],
	myUser?:ResolverInputTypes["User"],
user?: [{	where: ResolverInputTypes["UserWhereUniqueInput"]},ResolverInputTypes["User"]],
users?: [{	where?: ResolverInputTypes["UserWhereInput"] | undefined | null,	orderBy?: Array<ResolverInputTypes["UserOrderByInput"]> | undefined | null,	take?: number | undefined | null,	skip?: number | undefined | null},ResolverInputTypes["User"]],
usersCount?: [{	where?: ResolverInputTypes["UserWhereInput"] | undefined | null},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	_empty?:boolean | `@${string}`,
register?: [{	data: ResolverInputTypes["RegistrationInput"]},ResolverInputTypes["Authentication"]],
requestPasswordReset?: [{	data: ResolverInputTypes["RequestPasswordResetInput"]},boolean | `@${string}`],
resetPassword?: [{	data: ResolverInputTypes["ResetPasswordInput"]},ResolverInputTypes["Authentication"]],
createUser?: [{	data: ResolverInputTypes["UserCreateInput"]},ResolverInputTypes["User"]],
updateMyUser?: [{	data: ResolverInputTypes["MyUserUpdateInput"]},ResolverInputTypes["User"]],
updateUser?: [{	where: ResolverInputTypes["UserWhereUniqueInput"],	data: ResolverInputTypes["UserUpdateInput"]},ResolverInputTypes["User"]],
deleteUser?: [{	where: ResolverInputTypes["UserWhereUniqueInput"]},ResolverInputTypes["User"]],
		__typename?: boolean | `@${string}`
}>;
	["IDFilter"]: {
	equals?: string | undefined | null,
	in?: Array<string> | undefined | null,
	notIn?: Array<string> | undefined | null,
	lt?: string | undefined | null,
	lte?: string | undefined | null,
	gt?: string | undefined | null,
	gte?: string | undefined | null,
	not?: ResolverInputTypes["IDFilter"] | undefined | null
};
	["RelationshipNullableFilter"]: {
	id?: string | undefined | null,
	is?: ResolverInputTypes["Null"] | undefined | null,
	isNot?: ResolverInputTypes["Null"] | undefined | null
};
	["ArrayNullableFilter"]: {
	equals?: Array<string> | undefined | null,
	hasSome?: Array<string> | undefined | null,
	hasEvery?: Array<string> | undefined | null,
	has?: string | undefined | null,
	isEmpty?: boolean | undefined | null
};
	["StringNullableFilter"]: {
	equals?: string | undefined | null,
	in?: Array<string> | undefined | null,
	notIn?: Array<string> | undefined | null,
	lt?: string | undefined | null,
	lte?: string | undefined | null,
	gt?: string | undefined | null,
	gte?: string | undefined | null,
	contains?: string | undefined | null,
	startsWith?: string | undefined | null,
	endsWith?: string | undefined | null,
	mode?: ResolverInputTypes["QueryMode"] | undefined | null,
	not?: ResolverInputTypes["NestedStringNullableFilter"] | undefined | null
};
	["NestedStringNullableFilter"]: {
	equals?: string | undefined | null,
	in?: Array<string> | undefined | null,
	notIn?: Array<string> | undefined | null,
	lt?: string | undefined | null,
	lte?: string | undefined | null,
	gt?: string | undefined | null,
	gte?: string | undefined | null,
	contains?: string | undefined | null,
	startsWith?: string | undefined | null,
	endsWith?: string | undefined | null,
	not?: ResolverInputTypes["NestedStringNullableFilter"] | undefined | null
};
	["IntNullableFilter"]: {
	equals?: number | undefined | null,
	in?: Array<number> | undefined | null,
	notIn?: Array<number> | undefined | null,
	lt?: number | undefined | null,
	lte?: number | undefined | null,
	gt?: number | undefined | null,
	gte?: number | undefined | null,
	not?: ResolverInputTypes["NestedIntNullableFilter"] | undefined | null
};
	["NestedIntNullableFilter"]: {
	equals?: number | undefined | null,
	in?: Array<number> | undefined | null,
	notIn?: Array<number> | undefined | null,
	lt?: number | undefined | null,
	lte?: number | undefined | null,
	gt?: number | undefined | null,
	gte?: number | undefined | null,
	not?: ResolverInputTypes["NestedIntNullableFilter"] | undefined | null
};
	["FloatNullableFilter"]: {
	equals?: number | undefined | null,
	in?: Array<number> | undefined | null,
	notIn?: Array<number> | undefined | null,
	lt?: number | undefined | null,
	lte?: number | undefined | null,
	gt?: number | undefined | null,
	gte?: number | undefined | null,
	not?: ResolverInputTypes["NestedFloatNullableFilter"] | undefined | null
};
	["NestedFloatNullableFilter"]: {
	equals?: number | undefined | null,
	in?: Array<number> | undefined | null,
	notIn?: Array<number> | undefined | null,
	lt?: number | undefined | null,
	lte?: number | undefined | null,
	gt?: number | undefined | null,
	gte?: number | undefined | null,
	not?: ResolverInputTypes["NestedFloatNullableFilter"] | undefined | null
};
	["BooleanNullableFilter"]: {
	equals?: boolean | undefined | null,
	not?: boolean | undefined | null
};
	["NestedBooleanNullableFilter"]: {
	equals?: boolean | undefined | null,
	not?: ResolverInputTypes["NestedBooleanNullableFilter"] | undefined | null
};
	["DateNullableFilter"]: {
	equals?: ResolverInputTypes["Date"] | undefined | null,
	gt?: ResolverInputTypes["Date"] | undefined | null,
	gte?: ResolverInputTypes["Date"] | undefined | null,
	in?: Array<ResolverInputTypes["Date"]> | undefined | null,
	lt?: ResolverInputTypes["Date"] | undefined | null,
	lte?: ResolverInputTypes["Date"] | undefined | null,
	not?: ResolverInputTypes["Date"] | undefined | null,
	notIn?: Array<ResolverInputTypes["Date"]> | undefined | null
};
	["NestedDateNullableFilter"]: {
	equals?: ResolverInputTypes["Date"] | undefined | null,
	in?: Array<ResolverInputTypes["Date"]> | undefined | null,
	notIn?: Array<ResolverInputTypes["Date"]> | undefined | null,
	lt?: ResolverInputTypes["Date"] | undefined | null,
	lte?: ResolverInputTypes["Date"] | undefined | null,
	gt?: ResolverInputTypes["Date"] | undefined | null,
	gte?: ResolverInputTypes["Date"] | undefined | null,
	not?: ResolverInputTypes["NestedDateNullableFilter"] | undefined | null
};
	["QueryMode"]:QueryMode;
	["OrderDirection"]:OrderDirection;
	["BatchPayload"]: AliasType<{
	count?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Gender"]:Gender;
	["MessageResponse"]: AliasType<{
	message?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Upload"]:unknown;
	["Date"]:unknown;
	["Null"]:unknown;
	["NullableString"]:unknown;
	["NullableNumber"]:unknown;
	["NullableID"]:unknown;
	["UntrimmedString"]:unknown;
	["LowercaseString"]:unknown;
	["UppercaseString"]:unknown;
	["EmailAddress"]:unknown;
	["Password"]:unknown;
	["OTP"]:unknown;
	["PhoneNumber"]:unknown;
	["UserRole"]:UserRole;
	["User"]: AliasType<{
	id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	email?:boolean | `@${string}`,
	role?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	updatedAt?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UserWhereUniqueInput"]: {
	id?: string | undefined | null,
	email?: string | undefined | null
};
	["UserRoleNullableFilter"]: {
	equals?: ResolverInputTypes["UserRole"] | undefined | null,
	in?: Array<ResolverInputTypes["UserRole"]> | undefined | null,
	notIn?: Array<ResolverInputTypes["UserRole"]> | undefined | null
};
	["UserWhereInput"]: {
	AND?: Array<ResolverInputTypes["UserWhereInput"]> | undefined | null,
	OR?: Array<ResolverInputTypes["UserWhereInput"]> | undefined | null,
	NOT?: Array<ResolverInputTypes["UserWhereInput"]> | undefined | null,
	id?: ResolverInputTypes["IDFilter"] | undefined | null,
	name?: ResolverInputTypes["StringNullableFilter"] | undefined | null,
	email?: ResolverInputTypes["StringNullableFilter"] | undefined | null,
	role?: ResolverInputTypes["UserRoleNullableFilter"] | undefined | null
};
	["UserCreateInput"]: {
	name: string,
	email: string,
	password: ResolverInputTypes["Password"],
	role?: ResolverInputTypes["UserRole"] | undefined | null
};
	["UserUpdateInput"]: {
	name?: string | undefined | null,
	email?: string | undefined | null,
	password?: ResolverInputTypes["Password"] | undefined | null,
	role?: ResolverInputTypes["UserRole"] | undefined | null
};
	["MyUserUpdateInput"]: {
	name?: string | undefined | null,
	email?: string | undefined | null
};
	["UserOrderByInput"]: {
	id?: ResolverInputTypes["OrderDirection"] | undefined | null,
	name?: ResolverInputTypes["OrderDirection"] | undefined | null,
	email?: ResolverInputTypes["OrderDirection"] | undefined | null,
	role?: ResolverInputTypes["OrderDirection"] | undefined | null,
	createdAt?: ResolverInputTypes["OrderDirection"] | undefined | null
}
  }

export type ModelTypes = {
    ["Authentication"]: {
		user: ModelTypes["User"],
	token: string
};
	["LoginInput"]: {
	email: ModelTypes["EmailAddress"],
	password: string
};
	["CheckEmailInput"]: {
	email: ModelTypes["EmailAddress"]
};
	["RefreshTokenInput"]: {
	token: string
};
	["RegistrationInput"]: {
	name: string,
	email: ModelTypes["EmailAddress"],
	password: ModelTypes["Password"]
};
	["RequestPasswordResetInput"]: {
	email: ModelTypes["EmailAddress"]
};
	["ResetPasswordInput"]: {
	token: string,
	password: ModelTypes["Password"]
};
	["Query"]: {
		_empty?: string | undefined,
	login?: ModelTypes["Authentication"] | undefined,
	checkEmail?: boolean | undefined,
	refreshToken?: ModelTypes["Authentication"] | undefined,
	myUser?: ModelTypes["User"] | undefined,
	user?: ModelTypes["User"] | undefined,
	users: Array<ModelTypes["User"]>,
	usersCount?: number | undefined
};
	["Mutation"]: {
		_empty?: string | undefined,
	register?: ModelTypes["Authentication"] | undefined,
	requestPasswordReset?: boolean | undefined,
	resetPassword?: ModelTypes["Authentication"] | undefined,
	createUser?: ModelTypes["User"] | undefined,
	updateMyUser?: ModelTypes["User"] | undefined,
	updateUser?: ModelTypes["User"] | undefined,
	deleteUser?: ModelTypes["User"] | undefined
};
	["IDFilter"]: {
	equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	not?: ModelTypes["IDFilter"] | undefined
};
	["RelationshipNullableFilter"]: {
	id?: string | undefined,
	is?: ModelTypes["Null"] | undefined,
	isNot?: ModelTypes["Null"] | undefined
};
	["ArrayNullableFilter"]: {
	equals?: Array<string> | undefined,
	hasSome?: Array<string> | undefined,
	hasEvery?: Array<string> | undefined,
	has?: string | undefined,
	isEmpty?: boolean | undefined
};
	["StringNullableFilter"]: {
	equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	contains?: string | undefined,
	startsWith?: string | undefined,
	endsWith?: string | undefined,
	mode?: ModelTypes["QueryMode"] | undefined,
	not?: ModelTypes["NestedStringNullableFilter"] | undefined
};
	["NestedStringNullableFilter"]: {
	equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	contains?: string | undefined,
	startsWith?: string | undefined,
	endsWith?: string | undefined,
	not?: ModelTypes["NestedStringNullableFilter"] | undefined
};
	["IntNullableFilter"]: {
	equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: ModelTypes["NestedIntNullableFilter"] | undefined
};
	["NestedIntNullableFilter"]: {
	equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: ModelTypes["NestedIntNullableFilter"] | undefined
};
	["FloatNullableFilter"]: {
	equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: ModelTypes["NestedFloatNullableFilter"] | undefined
};
	["NestedFloatNullableFilter"]: {
	equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: ModelTypes["NestedFloatNullableFilter"] | undefined
};
	["BooleanNullableFilter"]: {
	equals?: boolean | undefined,
	not?: boolean | undefined
};
	["NestedBooleanNullableFilter"]: {
	equals?: boolean | undefined,
	not?: ModelTypes["NestedBooleanNullableFilter"] | undefined
};
	["DateNullableFilter"]: {
	equals?: ModelTypes["Date"] | undefined,
	gt?: ModelTypes["Date"] | undefined,
	gte?: ModelTypes["Date"] | undefined,
	in?: Array<ModelTypes["Date"]> | undefined,
	lt?: ModelTypes["Date"] | undefined,
	lte?: ModelTypes["Date"] | undefined,
	not?: ModelTypes["Date"] | undefined,
	notIn?: Array<ModelTypes["Date"]> | undefined
};
	["NestedDateNullableFilter"]: {
	equals?: ModelTypes["Date"] | undefined,
	in?: Array<ModelTypes["Date"]> | undefined,
	notIn?: Array<ModelTypes["Date"]> | undefined,
	lt?: ModelTypes["Date"] | undefined,
	lte?: ModelTypes["Date"] | undefined,
	gt?: ModelTypes["Date"] | undefined,
	gte?: ModelTypes["Date"] | undefined,
	not?: ModelTypes["NestedDateNullableFilter"] | undefined
};
	["QueryMode"]:QueryMode;
	["OrderDirection"]:OrderDirection;
	["BatchPayload"]: {
		count: number
};
	["Gender"]:Gender;
	["MessageResponse"]: {
		message: string
};
	["Upload"]:any;
	["Date"]:any;
	["Null"]:any;
	["NullableString"]:any;
	["NullableNumber"]:any;
	["NullableID"]:any;
	["UntrimmedString"]:any;
	["LowercaseString"]:any;
	["UppercaseString"]:any;
	["EmailAddress"]:any;
	["Password"]:any;
	["OTP"]:any;
	["PhoneNumber"]:any;
	["UserRole"]:UserRole;
	["User"]: {
		id: string,
	name: string,
	email: string,
	role: ModelTypes["UserRole"],
	createdAt: ModelTypes["Date"],
	updatedAt: ModelTypes["Date"]
};
	["UserWhereUniqueInput"]: {
	id?: string | undefined,
	email?: string | undefined
};
	["UserRoleNullableFilter"]: {
	equals?: ModelTypes["UserRole"] | undefined,
	in?: Array<ModelTypes["UserRole"]> | undefined,
	notIn?: Array<ModelTypes["UserRole"]> | undefined
};
	["UserWhereInput"]: {
	AND?: Array<ModelTypes["UserWhereInput"]> | undefined,
	OR?: Array<ModelTypes["UserWhereInput"]> | undefined,
	NOT?: Array<ModelTypes["UserWhereInput"]> | undefined,
	id?: ModelTypes["IDFilter"] | undefined,
	name?: ModelTypes["StringNullableFilter"] | undefined,
	email?: ModelTypes["StringNullableFilter"] | undefined,
	role?: ModelTypes["UserRoleNullableFilter"] | undefined
};
	["UserCreateInput"]: {
	name: string,
	email: string,
	password: ModelTypes["Password"],
	role?: ModelTypes["UserRole"] | undefined
};
	["UserUpdateInput"]: {
	name?: string | undefined,
	email?: string | undefined,
	password?: ModelTypes["Password"] | undefined,
	role?: ModelTypes["UserRole"] | undefined
};
	["MyUserUpdateInput"]: {
	name?: string | undefined,
	email?: string | undefined
};
	["UserOrderByInput"]: {
	id?: ModelTypes["OrderDirection"] | undefined,
	name?: ModelTypes["OrderDirection"] | undefined,
	email?: ModelTypes["OrderDirection"] | undefined,
	role?: ModelTypes["OrderDirection"] | undefined,
	createdAt?: ModelTypes["OrderDirection"] | undefined
}
    }

export type GraphQLTypes = {
    ["Authentication"]: {
	__typename: "Authentication",
	user: GraphQLTypes["User"],
	token: string
};
	["LoginInput"]: {
		email: GraphQLTypes["EmailAddress"],
	password: string
};
	["CheckEmailInput"]: {
		email: GraphQLTypes["EmailAddress"]
};
	["RefreshTokenInput"]: {
		token: string
};
	["RegistrationInput"]: {
		name: string,
	email: GraphQLTypes["EmailAddress"],
	password: GraphQLTypes["Password"]
};
	["RequestPasswordResetInput"]: {
		email: GraphQLTypes["EmailAddress"]
};
	["ResetPasswordInput"]: {
		token: string,
	password: GraphQLTypes["Password"]
};
	["Query"]: {
	__typename: "Query",
	_empty?: string | undefined,
	login?: GraphQLTypes["Authentication"] | undefined,
	checkEmail?: boolean | undefined,
	refreshToken?: GraphQLTypes["Authentication"] | undefined,
	myUser?: GraphQLTypes["User"] | undefined,
	user?: GraphQLTypes["User"] | undefined,
	users: Array<GraphQLTypes["User"]>,
	usersCount?: number | undefined
};
	["Mutation"]: {
	__typename: "Mutation",
	_empty?: string | undefined,
	register?: GraphQLTypes["Authentication"] | undefined,
	requestPasswordReset?: boolean | undefined,
	resetPassword?: GraphQLTypes["Authentication"] | undefined,
	createUser?: GraphQLTypes["User"] | undefined,
	updateMyUser?: GraphQLTypes["User"] | undefined,
	updateUser?: GraphQLTypes["User"] | undefined,
	deleteUser?: GraphQLTypes["User"] | undefined
};
	["IDFilter"]: {
		equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	not?: GraphQLTypes["IDFilter"] | undefined
};
	["RelationshipNullableFilter"]: {
		id?: string | undefined,
	is?: GraphQLTypes["Null"] | undefined,
	isNot?: GraphQLTypes["Null"] | undefined
};
	["ArrayNullableFilter"]: {
		equals?: Array<string> | undefined,
	hasSome?: Array<string> | undefined,
	hasEvery?: Array<string> | undefined,
	has?: string | undefined,
	isEmpty?: boolean | undefined
};
	["StringNullableFilter"]: {
		equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	contains?: string | undefined,
	startsWith?: string | undefined,
	endsWith?: string | undefined,
	mode?: GraphQLTypes["QueryMode"] | undefined,
	not?: GraphQLTypes["NestedStringNullableFilter"] | undefined
};
	["NestedStringNullableFilter"]: {
		equals?: string | undefined,
	in?: Array<string> | undefined,
	notIn?: Array<string> | undefined,
	lt?: string | undefined,
	lte?: string | undefined,
	gt?: string | undefined,
	gte?: string | undefined,
	contains?: string | undefined,
	startsWith?: string | undefined,
	endsWith?: string | undefined,
	not?: GraphQLTypes["NestedStringNullableFilter"] | undefined
};
	["IntNullableFilter"]: {
		equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: GraphQLTypes["NestedIntNullableFilter"] | undefined
};
	["NestedIntNullableFilter"]: {
		equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: GraphQLTypes["NestedIntNullableFilter"] | undefined
};
	["FloatNullableFilter"]: {
		equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: GraphQLTypes["NestedFloatNullableFilter"] | undefined
};
	["NestedFloatNullableFilter"]: {
		equals?: number | undefined,
	in?: Array<number> | undefined,
	notIn?: Array<number> | undefined,
	lt?: number | undefined,
	lte?: number | undefined,
	gt?: number | undefined,
	gte?: number | undefined,
	not?: GraphQLTypes["NestedFloatNullableFilter"] | undefined
};
	["BooleanNullableFilter"]: {
		equals?: boolean | undefined,
	not?: boolean | undefined
};
	["NestedBooleanNullableFilter"]: {
		equals?: boolean | undefined,
	not?: GraphQLTypes["NestedBooleanNullableFilter"] | undefined
};
	["DateNullableFilter"]: {
		equals?: GraphQLTypes["Date"] | undefined,
	gt?: GraphQLTypes["Date"] | undefined,
	gte?: GraphQLTypes["Date"] | undefined,
	in?: Array<GraphQLTypes["Date"]> | undefined,
	lt?: GraphQLTypes["Date"] | undefined,
	lte?: GraphQLTypes["Date"] | undefined,
	not?: GraphQLTypes["Date"] | undefined,
	notIn?: Array<GraphQLTypes["Date"]> | undefined
};
	["NestedDateNullableFilter"]: {
		equals?: GraphQLTypes["Date"] | undefined,
	in?: Array<GraphQLTypes["Date"]> | undefined,
	notIn?: Array<GraphQLTypes["Date"]> | undefined,
	lt?: GraphQLTypes["Date"] | undefined,
	lte?: GraphQLTypes["Date"] | undefined,
	gt?: GraphQLTypes["Date"] | undefined,
	gte?: GraphQLTypes["Date"] | undefined,
	not?: GraphQLTypes["NestedDateNullableFilter"] | undefined
};
	["QueryMode"]: QueryMode;
	["OrderDirection"]: OrderDirection;
	["BatchPayload"]: {
	__typename: "BatchPayload",
	count: number
};
	["Gender"]: Gender;
	["MessageResponse"]: {
	__typename: "MessageResponse",
	message: string
};
	["Upload"]: CustomTypes.File;
	["Date"]: Date;
	["Null"]: null | undefined;
	["NullableString"]: null | string;
	["NullableNumber"]: null | number;
	["NullableID"]: null | string;
	["UntrimmedString"]: string;
	["LowercaseString"]: string;
	["UppercaseString"]: string;
	["EmailAddress"]: string;
	["Password"]: string;
	["OTP"]: string;
	["PhoneNumber"]: string;
	["UserRole"]: UserRole;
	["User"]: {
	__typename: "User",
	id: string,
	name: string,
	email: string,
	role: GraphQLTypes["UserRole"],
	createdAt: GraphQLTypes["Date"],
	updatedAt: GraphQLTypes["Date"]
};
	["UserWhereUniqueInput"]: {
		id?: string | undefined,
	email?: string | undefined
};
	["UserRoleNullableFilter"]: {
		equals?: GraphQLTypes["UserRole"] | undefined,
	in?: Array<GraphQLTypes["UserRole"]> | undefined,
	notIn?: Array<GraphQLTypes["UserRole"]> | undefined
};
	["UserWhereInput"]: {
		AND?: Array<GraphQLTypes["UserWhereInput"]> | undefined,
	OR?: Array<GraphQLTypes["UserWhereInput"]> | undefined,
	NOT?: Array<GraphQLTypes["UserWhereInput"]> | undefined,
	id?: GraphQLTypes["IDFilter"] | undefined,
	name?: GraphQLTypes["StringNullableFilter"] | undefined,
	email?: GraphQLTypes["StringNullableFilter"] | undefined,
	role?: GraphQLTypes["UserRoleNullableFilter"] | undefined
};
	["UserCreateInput"]: {
		name: string,
	email: string,
	password: GraphQLTypes["Password"],
	role?: GraphQLTypes["UserRole"] | undefined
};
	["UserUpdateInput"]: {
		name?: string | undefined,
	email?: string | undefined,
	password?: GraphQLTypes["Password"] | undefined,
	role?: GraphQLTypes["UserRole"] | undefined
};
	["MyUserUpdateInput"]: {
		name?: string | undefined,
	email?: string | undefined
};
	["UserOrderByInput"]: {
		id?: GraphQLTypes["OrderDirection"] | undefined,
	name?: GraphQLTypes["OrderDirection"] | undefined,
	email?: GraphQLTypes["OrderDirection"] | undefined,
	role?: GraphQLTypes["OrderDirection"] | undefined,
	createdAt?: GraphQLTypes["OrderDirection"] | undefined
}
    }
export type QueryMode = 
	"default"|
	"insensitive"

export type OrderDirection = 
	"asc"|
	"desc"

export type Gender = 
	"MALE"|
	"FEMALE"

export type UserRole = 
	"DEFAULT"|
	"ADMIN"


type ZEUS_VARIABLES = {
	["LoginInput"]: ValueTypes["LoginInput"];
	["CheckEmailInput"]: ValueTypes["CheckEmailInput"];
	["RefreshTokenInput"]: ValueTypes["RefreshTokenInput"];
	["RegistrationInput"]: ValueTypes["RegistrationInput"];
	["RequestPasswordResetInput"]: ValueTypes["RequestPasswordResetInput"];
	["ResetPasswordInput"]: ValueTypes["ResetPasswordInput"];
	["IDFilter"]: ValueTypes["IDFilter"];
	["RelationshipNullableFilter"]: ValueTypes["RelationshipNullableFilter"];
	["ArrayNullableFilter"]: ValueTypes["ArrayNullableFilter"];
	["StringNullableFilter"]: ValueTypes["StringNullableFilter"];
	["NestedStringNullableFilter"]: ValueTypes["NestedStringNullableFilter"];
	["IntNullableFilter"]: ValueTypes["IntNullableFilter"];
	["NestedIntNullableFilter"]: ValueTypes["NestedIntNullableFilter"];
	["FloatNullableFilter"]: ValueTypes["FloatNullableFilter"];
	["NestedFloatNullableFilter"]: ValueTypes["NestedFloatNullableFilter"];
	["BooleanNullableFilter"]: ValueTypes["BooleanNullableFilter"];
	["NestedBooleanNullableFilter"]: ValueTypes["NestedBooleanNullableFilter"];
	["DateNullableFilter"]: ValueTypes["DateNullableFilter"];
	["NestedDateNullableFilter"]: ValueTypes["NestedDateNullableFilter"];
	["QueryMode"]: ValueTypes["QueryMode"];
	["OrderDirection"]: ValueTypes["OrderDirection"];
	["Gender"]: ValueTypes["Gender"];
	["Upload"]: ValueTypes["Upload"];
	["Date"]: ValueTypes["Date"];
	["Null"]: ValueTypes["Null"];
	["NullableString"]: ValueTypes["NullableString"];
	["NullableNumber"]: ValueTypes["NullableNumber"];
	["NullableID"]: ValueTypes["NullableID"];
	["UntrimmedString"]: ValueTypes["UntrimmedString"];
	["LowercaseString"]: ValueTypes["LowercaseString"];
	["UppercaseString"]: ValueTypes["UppercaseString"];
	["EmailAddress"]: ValueTypes["EmailAddress"];
	["Password"]: ValueTypes["Password"];
	["OTP"]: ValueTypes["OTP"];
	["PhoneNumber"]: ValueTypes["PhoneNumber"];
	["UserRole"]: ValueTypes["UserRole"];
	["UserWhereUniqueInput"]: ValueTypes["UserWhereUniqueInput"];
	["UserRoleNullableFilter"]: ValueTypes["UserRoleNullableFilter"];
	["UserWhereInput"]: ValueTypes["UserWhereInput"];
	["UserCreateInput"]: ValueTypes["UserCreateInput"];
	["UserUpdateInput"]: ValueTypes["UserUpdateInput"];
	["MyUserUpdateInput"]: ValueTypes["MyUserUpdateInput"];
	["UserOrderByInput"]: ValueTypes["UserOrderByInput"];
}