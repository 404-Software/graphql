import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { User as UserModel } from '@prisma/client';
import { Context } from './context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  Null: any;
  NullableID: null | string;
  NullableString: null | string;
  Upload: any;
};

export type ArrayNullableFilter = {
  equals?: InputMaybe<Array<Scalars['String']>>;
  has?: InputMaybe<Scalars['String']>;
  hasEvery?: InputMaybe<Array<Scalars['String']>>;
  hasSome?: InputMaybe<Array<Scalars['String']>>;
  isEmpty?: InputMaybe<Scalars['Boolean']>;
};

export type Authentication = {
  __typename?: 'Authentication';
  token: Scalars['String'];
  user: User;
};

export type CheckEmailInput = {
  email: Scalars['String'];
};

export type IdFilter = {
  equals?: InputMaybe<Scalars['ID']>;
  gt?: InputMaybe<Scalars['ID']>;
  gte?: InputMaybe<Scalars['ID']>;
  in?: InputMaybe<Array<Scalars['ID']>>;
  lt?: InputMaybe<Scalars['ID']>;
  lte?: InputMaybe<Scalars['ID']>;
  not?: InputMaybe<IdFilter>;
  notIn?: InputMaybe<Array<Scalars['ID']>>;
};

export type LoginInput = {
  email: Scalars['String'];
  password: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  _empty?: Maybe<Scalars['String']>;
  createUser?: Maybe<User>;
  deleteUser?: Maybe<User>;
  register?: Maybe<Authentication>;
  requestPasswordReset?: Maybe<Scalars['Boolean']>;
  resetPassword?: Maybe<Authentication>;
  updateMyUser?: Maybe<User>;
  updateUser?: Maybe<User>;
};


export type MutationCreateUserArgs = {
  data: UserCreateInput;
};


export type MutationDeleteUserArgs = {
  where: UserWhereUniqueInput;
};


export type MutationRegisterArgs = {
  data: RegistrationInput;
};


export type MutationRequestPasswordResetArgs = {
  data: RequestPasswordResetInput;
};


export type MutationResetPasswordArgs = {
  data: ResetPasswordInput;
};


export type MutationUpdateMyUserArgs = {
  data: MyUserUpdateInput;
};


export type MutationUpdateUserArgs = {
  data: UserUpdateInput;
  where: UserWhereUniqueInput;
};

export type MyUserUpdateInput = {
  email?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
};

export type NestedStringNullableFilter = {
  contains?: InputMaybe<Scalars['String']>;
  endsWith?: InputMaybe<Scalars['String']>;
  equals?: InputMaybe<Scalars['String']>;
  gt?: InputMaybe<Scalars['String']>;
  gte?: InputMaybe<Scalars['String']>;
  in?: InputMaybe<Array<Scalars['String']>>;
  lt?: InputMaybe<Scalars['String']>;
  lte?: InputMaybe<Scalars['String']>;
  not?: InputMaybe<NestedStringNullableFilter>;
  notIn?: InputMaybe<Array<Scalars['String']>>;
  startsWith?: InputMaybe<Scalars['String']>;
};

export type OrderDirection =
  | 'asc'
  | 'desc';

export type Query = {
  __typename?: 'Query';
  _empty?: Maybe<Scalars['String']>;
  checkEmail?: Maybe<Scalars['Boolean']>;
  login?: Maybe<Authentication>;
  myUser?: Maybe<User>;
  refreshToken?: Maybe<Authentication>;
  user?: Maybe<User>;
  users: Array<User>;
  usersCount?: Maybe<Scalars['Int']>;
};


export type QueryCheckEmailArgs = {
  data: CheckEmailInput;
};


export type QueryLoginArgs = {
  data: LoginInput;
};


export type QueryRefreshTokenArgs = {
  data: RefreshTokenInput;
};


export type QueryUserArgs = {
  where: UserWhereUniqueInput;
};


export type QueryUsersArgs = {
  orderBy?: InputMaybe<Array<UserOrderByInput>>;
  skip?: InputMaybe<Scalars['Int']>;
  take?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryUsersCountArgs = {
  where?: InputMaybe<UserWhereInput>;
};

export type QueryMode =
  | 'default'
  | 'insensitive';

export type RefreshTokenInput = {
  token: Scalars['String'];
};

export type RegistrationInput = {
  email: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
};

export type RelationshipNullableFilter = {
  id?: InputMaybe<Scalars['ID']>;
  is?: InputMaybe<Scalars['Null']>;
  isNot?: InputMaybe<Scalars['Null']>;
};

export type RequestPasswordResetInput = {
  email: Scalars['String'];
};

export type ResetPasswordInput = {
  password: Scalars['String'];
  token: Scalars['String'];
};

export type StringNullableFilter = {
  contains?: InputMaybe<Scalars['String']>;
  endsWith?: InputMaybe<Scalars['String']>;
  equals?: InputMaybe<Scalars['String']>;
  gt?: InputMaybe<Scalars['String']>;
  gte?: InputMaybe<Scalars['String']>;
  in?: InputMaybe<Array<Scalars['String']>>;
  lt?: InputMaybe<Scalars['String']>;
  lte?: InputMaybe<Scalars['String']>;
  mode?: InputMaybe<QueryMode>;
  not?: InputMaybe<NestedStringNullableFilter>;
  notIn?: InputMaybe<Array<Scalars['String']>>;
  startsWith?: InputMaybe<Scalars['String']>;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['Date'];
  email: Scalars['String'];
  id: Scalars['ID'];
  name: Scalars['String'];
  role: UserRole;
  updatedAt: Scalars['Date'];
};

export type UserCreateInput = {
  email: Scalars['String'];
  name: Scalars['String'];
  password: Scalars['String'];
  role?: InputMaybe<UserRole>;
};

export type UserOrderByInput = {
  createdAt?: InputMaybe<OrderDirection>;
  email?: InputMaybe<OrderDirection>;
  id?: InputMaybe<OrderDirection>;
  name?: InputMaybe<OrderDirection>;
  role?: InputMaybe<OrderDirection>;
};

export type UserRole =
  | 'ADMIN'
  | 'DEFAULT';

export type UserRoleNullableFilter = {
  equals?: InputMaybe<UserRole>;
  in?: InputMaybe<Array<UserRole>>;
  notIn?: InputMaybe<Array<UserRole>>;
};

export type UserUpdateInput = {
  email?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  password?: InputMaybe<Scalars['String']>;
  role?: InputMaybe<UserRole>;
};

export type UserWhereInput = {
  AND?: InputMaybe<Array<UserWhereInput>>;
  NOT?: InputMaybe<Array<UserWhereInput>>;
  OR?: InputMaybe<Array<UserWhereInput>>;
  email?: InputMaybe<StringNullableFilter>;
  id?: InputMaybe<IdFilter>;
  name?: InputMaybe<StringNullableFilter>;
  role?: InputMaybe<UserRoleNullableFilter>;
};

export type UserWhereUniqueInput = {
  email?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ArrayNullableFilter: ArrayNullableFilter;
  Authentication: ResolverTypeWrapper<Omit<Authentication, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CheckEmailInput: CheckEmailInput;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  IDFilter: IdFilter;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  LoginInput: LoginInput;
  Mutation: ResolverTypeWrapper<{}>;
  MyUserUpdateInput: MyUserUpdateInput;
  NestedStringNullableFilter: NestedStringNullableFilter;
  Null: ResolverTypeWrapper<Scalars['Null']>;
  NullableID: ResolverTypeWrapper<Scalars['NullableID']>;
  NullableString: ResolverTypeWrapper<Scalars['NullableString']>;
  OrderDirection: OrderDirection;
  Query: ResolverTypeWrapper<{}>;
  QueryMode: QueryMode;
  RefreshTokenInput: RefreshTokenInput;
  RegistrationInput: RegistrationInput;
  RelationshipNullableFilter: RelationshipNullableFilter;
  RequestPasswordResetInput: RequestPasswordResetInput;
  ResetPasswordInput: ResetPasswordInput;
  String: ResolverTypeWrapper<Scalars['String']>;
  StringNullableFilter: StringNullableFilter;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  User: ResolverTypeWrapper<UserModel>;
  UserCreateInput: UserCreateInput;
  UserOrderByInput: UserOrderByInput;
  UserRole: UserRole;
  UserRoleNullableFilter: UserRoleNullableFilter;
  UserUpdateInput: UserUpdateInput;
  UserWhereInput: UserWhereInput;
  UserWhereUniqueInput: UserWhereUniqueInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ArrayNullableFilter: ArrayNullableFilter;
  Authentication: Omit<Authentication, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean'];
  CheckEmailInput: CheckEmailInput;
  Date: Scalars['Date'];
  ID: Scalars['ID'];
  IDFilter: IdFilter;
  Int: Scalars['Int'];
  LoginInput: LoginInput;
  Mutation: {};
  MyUserUpdateInput: MyUserUpdateInput;
  NestedStringNullableFilter: NestedStringNullableFilter;
  Null: Scalars['Null'];
  NullableID: Scalars['NullableID'];
  NullableString: Scalars['NullableString'];
  Query: {};
  RefreshTokenInput: RefreshTokenInput;
  RegistrationInput: RegistrationInput;
  RelationshipNullableFilter: RelationshipNullableFilter;
  RequestPasswordResetInput: RequestPasswordResetInput;
  ResetPasswordInput: ResetPasswordInput;
  String: Scalars['String'];
  StringNullableFilter: StringNullableFilter;
  Upload: Scalars['Upload'];
  User: UserModel;
  UserCreateInput: UserCreateInput;
  UserOrderByInput: UserOrderByInput;
  UserRoleNullableFilter: UserRoleNullableFilter;
  UserUpdateInput: UserUpdateInput;
  UserWhereInput: UserWhereInput;
  UserWhereUniqueInput: UserWhereUniqueInput;
};

export type AuthenticationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Authentication'] = ResolversParentTypes['Authentication']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type MutationResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'data'>>;
  deleteUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'where'>>;
  register?: Resolver<Maybe<ResolversTypes['Authentication']>, ParentType, ContextType, RequireFields<MutationRegisterArgs, 'data'>>;
  requestPasswordReset?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationRequestPasswordResetArgs, 'data'>>;
  resetPassword?: Resolver<Maybe<ResolversTypes['Authentication']>, ParentType, ContextType, RequireFields<MutationResetPasswordArgs, 'data'>>;
  updateMyUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateMyUserArgs, 'data'>>;
  updateUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUpdateUserArgs, 'data' | 'where'>>;
};

export interface NullScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Null'], any> {
  name: 'Null';
}

export interface NullableIdScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NullableID'], any> {
  name: 'NullableID';
}

export interface NullableStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NullableString'], any> {
  name: 'NullableString';
}

export type QueryResolvers<ContextType = Context, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  _empty?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  checkEmail?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<QueryCheckEmailArgs, 'data'>>;
  login?: Resolver<Maybe<ResolversTypes['Authentication']>, ParentType, ContextType, RequireFields<QueryLoginArgs, 'data'>>;
  myUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  refreshToken?: Resolver<Maybe<ResolversTypes['Authentication']>, ParentType, ContextType, RequireFields<QueryRefreshTokenArgs, 'data'>>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'where'>>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUsersArgs, 'skip' | 'take' | 'where'>>;
  usersCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType, RequireFields<QueryUsersCountArgs, 'where'>>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type UserResolvers<ContextType = Context, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  role?: Resolver<ResolversTypes['UserRole'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = Context> = {
  Authentication?: AuthenticationResolvers<ContextType>;
  Date?: GraphQLScalarType;
  Mutation?: MutationResolvers<ContextType>;
  Null?: GraphQLScalarType;
  NullableID?: GraphQLScalarType;
  NullableString?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
};

