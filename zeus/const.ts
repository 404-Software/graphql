/* eslint-disable */

export const AllTypesProps: Record<string,any> = {
	LoginInput:{
		email:"EmailAddress"
	},
	CheckEmailInput:{
		email:"EmailAddress"
	},
	RefreshTokenInput:{

	},
	RegistrationInput:{
		email:"EmailAddress",
		password:"Password"
	},
	RequestPasswordResetInput:{
		email:"EmailAddress"
	},
	ResetPasswordInput:{
		password:"Password"
	},
	Query:{
		login:{
			data:"LoginInput"
		},
		checkEmail:{
			data:"CheckEmailInput"
		},
		refreshToken:{
			data:"RefreshTokenInput"
		},
		user:{
			where:"UserWhereUniqueInput"
		},
		users:{
			where:"UserWhereInput",
			orderBy:"UserOrderByInput"
		},
		usersCount:{
			where:"UserWhereInput"
		}
	},
	Mutation:{
		register:{
			data:"RegistrationInput"
		},
		requestPasswordReset:{
			data:"RequestPasswordResetInput"
		},
		resetPassword:{
			data:"ResetPasswordInput"
		},
		createUser:{
			data:"UserCreateInput"
		},
		updateMyUser:{
			data:"MyUserUpdateInput"
		},
		updateUser:{
			where:"UserWhereUniqueInput",
			data:"UserUpdateInput"
		},
		deleteUser:{
			where:"UserWhereUniqueInput"
		}
	},
	IDFilter:{
		not:"IDFilter"
	},
	RelationshipNullableFilter:{
		is:"Null",
		isNot:"Null"
	},
	ArrayNullableFilter:{

	},
	StringNullableFilter:{
		mode:"QueryMode",
		not:"NestedStringNullableFilter"
	},
	NestedStringNullableFilter:{
		not:"NestedStringNullableFilter"
	},
	IntNullableFilter:{
		not:"NestedIntNullableFilter"
	},
	NestedIntNullableFilter:{
		not:"NestedIntNullableFilter"
	},
	FloatNullableFilter:{
		not:"NestedFloatNullableFilter"
	},
	NestedFloatNullableFilter:{
		not:"NestedFloatNullableFilter"
	},
	BooleanNullableFilter:{

	},
	NestedBooleanNullableFilter:{
		not:"NestedBooleanNullableFilter"
	},
	DateNullableFilter:{
		equals:"Date",
		gt:"Date",
		gte:"Date",
		in:"Date",
		lt:"Date",
		lte:"Date",
		not:"Date",
		notIn:"Date"
	},
	NestedDateNullableFilter:{
		equals:"Date",
		in:"Date",
		notIn:"Date",
		lt:"Date",
		lte:"Date",
		gt:"Date",
		gte:"Date",
		not:"NestedDateNullableFilter"
	},
	QueryMode: "enum" as const,
	OrderDirection: "enum" as const,
	Gender: "enum" as const,
	File: `scalar.File` as const,
	Date: `scalar.Date` as const,
	Null: `scalar.Null` as const,
	NullableString: `scalar.NullableString` as const,
	NullableNumber: `scalar.NullableNumber` as const,
	NullableID: `scalar.NullableID` as const,
	UntrimmedString: `scalar.UntrimmedString` as const,
	LowercaseString: `scalar.LowercaseString` as const,
	UppercaseString: `scalar.UppercaseString` as const,
	EmailAddress: `scalar.EmailAddress` as const,
	Password: `scalar.Password` as const,
	OTP: `scalar.OTP` as const,
	PhoneNumber: `scalar.PhoneNumber` as const,
	UserRole: "enum" as const,
	UserWhereUniqueInput:{

	},
	UserRoleNullableFilter:{
		equals:"UserRole",
		in:"UserRole",
		notIn:"UserRole"
	},
	UserWhereInput:{
		AND:"UserWhereInput",
		OR:"UserWhereInput",
		NOT:"UserWhereInput",
		id:"IDFilter",
		name:"StringNullableFilter",
		email:"StringNullableFilter",
		role:"UserRoleNullableFilter"
	},
	UserCreateInput:{
		password:"Password",
		role:"UserRole"
	},
	UserUpdateInput:{
		password:"Password",
		role:"UserRole"
	},
	MyUserUpdateInput:{

	},
	UserOrderByInput:{
		id:"OrderDirection",
		name:"OrderDirection",
		email:"OrderDirection",
		role:"OrderDirection",
		createdAt:"OrderDirection"
	}
}

export const ReturnTypes: Record<string,any> = {
	Authentication:{
		user:"User",
		token:"String"
	},
	Query:{
		_empty:"String",
		login:"Authentication",
		checkEmail:"Boolean",
		refreshToken:"Authentication",
		myUser:"User",
		user:"User",
		users:"User",
		usersCount:"Int"
	},
	Mutation:{
		_empty:"String",
		register:"Authentication",
		requestPasswordReset:"Boolean",
		resetPassword:"Authentication",
		createUser:"User",
		updateMyUser:"User",
		updateUser:"User",
		deleteUser:"User"
	},
	BatchPayload:{
		count:"Int"
	},
	MessageResponse:{
		message:"String"
	},
	File: `scalar.File` as const,
	Date: `scalar.Date` as const,
	Null: `scalar.Null` as const,
	NullableString: `scalar.NullableString` as const,
	NullableNumber: `scalar.NullableNumber` as const,
	NullableID: `scalar.NullableID` as const,
	UntrimmedString: `scalar.UntrimmedString` as const,
	LowercaseString: `scalar.LowercaseString` as const,
	UppercaseString: `scalar.UppercaseString` as const,
	EmailAddress: `scalar.EmailAddress` as const,
	Password: `scalar.Password` as const,
	OTP: `scalar.OTP` as const,
	PhoneNumber: `scalar.PhoneNumber` as const,
	User:{
		id:"ID",
		name:"String",
		email:"String",
		role:"UserRole",
		createdAt:"Date",
		updatedAt:"Date"
	}
}

export const Ops = {
query: "Query" as const,
	mutation: "Mutation" as const
}