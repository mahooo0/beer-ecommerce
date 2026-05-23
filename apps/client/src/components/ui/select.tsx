"use client";

import type { FC, ReactNode, Ref, RefAttributes } from "react";
import { createContext, isValidElement, useContext } from "react";
import type { ListBoxItemProps as AriaListBoxItemProps, PopoverProps as AriaPopoverProps, SelectProps as AriaSelectProps } from "react-aria-components";
import {
    Button as AriaButton,
    ListBox as AriaListBox,
    ListBoxItem as AriaListBoxItem,
    Popover as AriaPopover,
    Select as AriaSelect,
    SelectValue as AriaSelectValue,
    Text as AriaText,
} from "react-aria-components";
import { Label } from "@/components/ui/input";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";

export type SelectItemType = {
    id: string;
    label?: string;
    isDisabled?: boolean;
    supportingText?: string;
    icon?: FC | ReactNode;
};

const SelectContext = createContext<{ size: "sm" | "md" }>({ size: "sm" });

const sizes = {
    sm: { root: "py-2 px-3" },
    md: { root: "py-2.5 px-3.5" },
};

// Popover
const SelectPopover = (props: AriaPopoverProps & RefAttributes<HTMLElement> & { size: "sm" | "md" }) => {
    return (
        <AriaPopover
            placement="bottom"
            containerPadding={0}
            offset={4}
            {...props}
            className={(state) =>
                cx(
                    "max-h-64! w-(--trigger-width) origin-(--trigger-anchor-point) overflow-x-hidden overflow-y-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform",
                    state.isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
                    state.isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
                    props.size === "md" && "max-h-80!",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};

// SelectItem
interface SelectItemProps extends Omit<AriaListBoxItemProps<SelectItemType>, "id">, SelectItemType {}

const SelectItem = ({ label, id, value, supportingText, isDisabled, icon: Icon, className, children, ...props }: SelectItemProps) => {
    const { size } = useContext(SelectContext);
    const labelOrChildren = label || (typeof children === "string" ? children : "");
    const textValue = supportingText ? labelOrChildren + " " + supportingText : labelOrChildren;

    const itemSizes = { sm: "p-2 pr-2.5", md: "p-2.5 pl-2" };

    return (
        <AriaListBoxItem
            id={id}
            value={value ?? { id, label: labelOrChildren, supportingText, isDisabled, icon: Icon }}
            textValue={textValue}
            isDisabled={isDisabled}
            {...props}
            className={(state) => cx("w-full px-1.5 py-px outline-hidden", typeof className === "function" ? className(state) : className)}
        >
            {(state) => (
                <div
                    className={cx(
                        "flex cursor-pointer items-center gap-2 rounded-md outline-hidden select-none",
                        state.isSelected && "bg-active",
                        state.isDisabled && "cursor-not-allowed",
                        state.isFocused && "bg-primary_hover",
                        "*:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary",
                        itemSizes[size],
                    )}
                >
                    {isReactComponent(Icon) ? (
                        <Icon data-icon aria-hidden="true" />
                    ) : isValidElement(Icon) ? (
                        Icon
                    ) : null}

                    <div className="flex w-full min-w-0 flex-1 flex-wrap gap-x-2">
                        <AriaText slot="label" className={cx("truncate text-md font-medium whitespace-nowrap text-primary", state.isDisabled && "text-disabled")}>
                            {label || (typeof children === "function" ? children(state) : children)}
                        </AriaText>
                        {supportingText && (
                            <AriaText slot="description" className={cx("text-md whitespace-nowrap text-tertiary", state.isDisabled && "text-disabled")}>
                                {supportingText}
                            </AriaText>
                        )}
                    </div>

                    {state.isSelected && (
                        <svg className="ml-auto size-4 shrink-0 text-fg-brand-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            )}
        </AriaListBoxItem>
    );
};

// SelectValue (trigger button)
interface SelectValueProps {
    isOpen: boolean;
    size: "sm" | "md";
    isFocused: boolean;
    isDisabled: boolean;
    placeholder?: string;
    ref?: Ref<HTMLButtonElement>;
}

const SelectValueButton = ({ isOpen, isFocused, isDisabled, size, placeholder, ref }: SelectValueProps) => {
    return (
        <AriaButton
            ref={ref}
            className={cx(
                "relative flex w-full cursor-pointer items-center rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset",
                (isFocused || isOpen) && "ring-2 ring-brand",
                isDisabled && "cursor-not-allowed bg-disabled_subtle text-disabled",
            )}
        >
            <AriaSelectValue<SelectItemType>
                className={cx(
                    "flex h-max w-full items-center justify-start gap-2 truncate text-left align-middle",
                    "*:data-icon:size-5 *:data-icon:shrink-0 *:data-icon:text-fg-quaternary",
                    sizes[size].root,
                )}
            >
                {(state) => (
                    <>
                        {state.selectedItem ? (
                            <section className="flex w-full gap-2 truncate">
                                <p className="truncate text-md font-medium text-primary">{state.selectedItem?.label}</p>
                                {state.selectedItem?.supportingText && <p className="text-md text-tertiary">{state.selectedItem?.supportingText}</p>}
                            </section>
                        ) : (
                            <p className={cx("text-md text-placeholder", isDisabled && "text-disabled")}>{placeholder}</p>
                        )}
                        <svg
                            aria-hidden="true"
                            className={cx("ml-auto shrink-0 text-fg-quaternary", size === "sm" ? "size-4 stroke-[2.5px]" : "size-5")}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </>
                )}
            </AriaSelectValue>
        </AriaButton>
    );
};

// Main Select
interface SelectProps extends Omit<AriaSelectProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement> {
    items?: SelectItemType[];
    hint?: string;
    label?: string;
    tooltip?: string;
    size?: "sm" | "md";
    placeholder?: string;
    popoverClassName?: string;
    children: ReactNode | ((item: SelectItemType) => ReactNode);
}

const Select = ({ placeholder = "Select", size = "sm", children, items, label, hint, className, ...rest }: SelectProps) => {
    return (
        <SelectContext.Provider value={{ size }}>
            <AriaSelect {...rest} className={(state) => cx("flex flex-col gap-1.5", typeof className === "function" ? className(state) : className)}>
                {(state) => (
                    <>
                        {label && <Label isRequired={state.isRequired}>{label}</Label>}
                        <SelectValueButton {...state} {...{ size, placeholder }} />
                        <SelectPopover size={size} className={rest.popoverClassName}>
                            <AriaListBox items={items} className="size-full outline-hidden">
                                {children}
                            </AriaListBox>
                        </SelectPopover>
                    </>
                )}
            </AriaSelect>
        </SelectContext.Provider>
    );
};

const _Select = Select as typeof Select & { Item: typeof SelectItem };
_Select.Item = SelectItem;

export { _Select as Select };
