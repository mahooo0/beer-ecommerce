"use client";

import type { ComponentType, HTMLAttributes, ReactNode, Ref } from "react";
import { createContext, useContext } from "react";
import type { InputProps as AriaInputProps, TextFieldProps as AriaTextFieldProps } from "react-aria-components";
import { Group as AriaGroup, Input as AriaInput, TextField as AriaTextField, Label as AriaLabel, Text as AriaText } from "react-aria-components";
import { cx, sortCx } from "@/utils/cx";

interface LabelProps {
    children: ReactNode;
    isRequired?: boolean;
    className?: string;
}

export const Label = ({ isRequired, className, children }: LabelProps) => {
    return (
        <AriaLabel data-label="true" className={cx("flex cursor-default items-center gap-0.5 text-sm font-medium text-secondary", className)}>
            {children}
            <span className={cx("hidden text-brand-tertiary", isRequired && "block", typeof isRequired === "undefined" && "group-required:block")}>*</span>
        </AriaLabel>
    );
};

interface HintTextProps {
    isInvalid?: boolean;
    children: ReactNode;
    className?: string;
}

export const HintText = ({ isInvalid, className, children }: HintTextProps) => {
    return (
        <AriaText
            slot={isInvalid ? "errorMessage" : "description"}
            className={cx("text-sm text-tertiary", isInvalid && "text-error-primary", "group-invalid:text-error-primary", className)}
        />
    );
};

interface InputBaseProps {
    size?: "sm" | "md";
    placeholder?: string;
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    isInvalid?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    wrapperClassName?: string;
    inputClassName?: string;
    iconClassName?: string;
    ref?: Ref<HTMLInputElement>;
    groupRef?: Ref<HTMLDivElement>;
}

const TextFieldContext = createContext<{ size?: "sm" | "md"; wrapperClassName?: string; inputClassName?: string; iconClassName?: string }>({});

export const InputBase = ({
    ref,
    groupRef,
    size = "sm",
    isInvalid,
    isDisabled,
    icon: Icon,
    placeholder,
    wrapperClassName,
    inputClassName,
    iconClassName,
    isRequired: _isRequired,
    ...inputProps
}: InputBaseProps & Omit<AriaInputProps, "size">) => {
    const hasLeadingIcon = Icon;
    const context = useContext(TextFieldContext);
    const inputSize = context?.size || size;

    const sizes = sortCx({
        sm: {
            root: cx("px-3 py-2", hasLeadingIcon && "pl-10"),
            iconLeading: "left-3",
        },
        md: {
            root: cx("px-3.5 py-2.5", hasLeadingIcon && "pl-10.5"),
            iconLeading: "left-3.5",
        },
    });

    return (
        <AriaGroup
            {...{ isDisabled, isInvalid }}
            ref={groupRef}
            className={({ isFocusWithin, isDisabled, isInvalid }) =>
                cx(
                    "relative flex w-full flex-row place-content-center place-items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary transition-shadow duration-100 ease-linear ring-inset",
                    isFocusWithin && !isDisabled && "ring-2 ring-brand",
                    isDisabled && "cursor-not-allowed bg-disabled_subtle ring-disabled",
                    isInvalid && "ring-error_subtle",
                    isInvalid && isFocusWithin && "ring-2 ring-error",
                    context?.wrapperClassName,
                    wrapperClassName,
                )
            }
        >
            {Icon && (
                <Icon
                    className={cx(
                        "pointer-events-none absolute size-5 text-fg-quaternary",
                        isDisabled && "text-fg-disabled",
                        sizes[inputSize].iconLeading,
                        context?.iconClassName,
                        iconClassName,
                    )}
                />
            )}
            <AriaInput
                {...(inputProps as AriaInputProps)}
                ref={ref}
                placeholder={placeholder}
                className={cx(
                    "m-0 w-full bg-transparent text-md text-primary ring-0 outline-hidden placeholder:text-placeholder autofill:rounded-lg autofill:text-primary",
                    isDisabled && "cursor-not-allowed text-disabled",
                    sizes[inputSize].root,
                    context?.inputClassName,
                    inputClassName,
                )}
            />
        </AriaGroup>
    );
};

interface InputProps extends InputBaseProps {
    label?: string;
    hint?: ReactNode;
    hideRequiredIndicator?: boolean;
    className?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    onChange?: AriaTextFieldProps["onChange"];
    onBlur?: AriaTextFieldProps["onBlur"];
}

export const Input = ({
    size = "sm",
    placeholder,
    icon: Icon,
    label,
    hint,
    hideRequiredIndicator,
    className,
    ref,
    groupRef,
    wrapperClassName,
    inputClassName,
    iconClassName,
    ...props
}: InputProps) => {
    return (
        <AriaTextField aria-label={!label ? placeholder : undefined} {...props} className={cx("group flex h-max w-full flex-col items-start justify-start gap-1.5", className)}>
            {({ isRequired, isInvalid }) => (
                <>
                    {label && <Label isRequired={hideRequiredIndicator ? false : isRequired}>{label}</Label>}
                    <InputBase
                        {...{
                            ref,
                            groupRef,
                            size,
                            placeholder,
                            icon: Icon,
                            iconClassName,
                            inputClassName,
                            wrapperClassName,
                        }}
                    />
                    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
                </>
            )}
        </AriaTextField>
    );
};
