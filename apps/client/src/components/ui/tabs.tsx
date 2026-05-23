"use client";

import type { ComponentPropsWithRef, ReactNode } from "react";
import { Fragment, createContext, useContext } from "react";
import type { TabListProps as AriaTabListProps, TabProps as AriaTabProps, TabRenderProps as AriaTabRenderProps } from "react-aria-components";
import { Tab as AriaTab, TabList as AriaTabList, TabPanel as AriaTabPanel, Tabs as AriaTabs, TabsContext, useSlottedContext } from "react-aria-components";
import { cx } from "@/utils/cx";

type TabType = "button-brand" | "button-gray" | "button-border" | "button-minimal" | "underline";

const getTabStyles = ({ isFocusVisible, isSelected, isHovered }: AriaTabRenderProps) => ({
    "button-brand": cx(
        "outline-focus-ring",
        isFocusVisible && "outline-2 -outline-offset-2",
        (isSelected || isHovered) && "bg-brand-primary_alt text-brand-secondary",
    ),
    "button-gray": cx(
        "outline-focus-ring",
        isHovered && "bg-primary_hover text-secondary",
        isFocusVisible && "outline-2 -outline-offset-2",
        isSelected && "bg-active text-secondary",
    ),
    "button-border": cx(
        "outline-focus-ring",
        (isSelected || isHovered) && "bg-primary_alt text-secondary shadow-sm",
        isFocusVisible && "outline-2 -outline-offset-2",
    ),
    "button-minimal": cx(
        "rounded-lg outline-focus-ring",
        isHovered && "text-secondary",
        isFocusVisible && "outline-2 -outline-offset-2",
        isSelected && "bg-primary_alt text-secondary shadow-xs ring-1 ring-primary ring-inset",
    ),
    underline: cx(
        "rounded-none border-b-2 border-transparent outline-focus-ring",
        (isSelected || isHovered) && "border-fg-brand-primary_alt text-brand-secondary",
        isFocusVisible && "outline-2 -outline-offset-2",
    ),
});

const sizes = {
    sm: {
        "button-brand": "text-sm font-semibold py-2 px-3",
        "button-gray": "text-sm font-semibold py-2 px-3",
        "button-border": "text-sm font-semibold py-2 px-3",
        "button-minimal": "text-sm font-semibold py-2 px-3",
        underline: "text-sm font-semibold px-1 pb-2.5 pt-0",
    },
    md: {
        "button-brand": "text-md font-semibold py-2.5 px-3",
        "button-gray": "text-md font-semibold py-2.5 px-3",
        "button-border": "text-md font-semibold py-2.5 px-3",
        "button-minimal": "text-md font-semibold py-2.5 px-3",
        underline: "text-md font-semibold px-1 pb-2.5 pt-0",
    },
};

const getListStyles = ({ size, fullWidth }: { size?: "sm" | "md"; fullWidth?: boolean }) => ({
    "button-brand": "gap-1",
    "button-gray": "gap-1",
    "button-border": cx("gap-1 rounded-[10px] bg-secondary_alt p-1 ring-1 ring-secondary ring-inset", size === "md" && "rounded-xl p-1.5"),
    "button-minimal": "gap-0.5 rounded-lg bg-secondary_alt ring-1 ring-inset ring-secondary",
    underline: cx("gap-3", fullWidth && "w-full gap-4"),
});

interface TabListComponentProps<T extends object> extends AriaTabListProps<T> {
    size?: keyof typeof sizes;
    type?: TabType;
    items: T[];
    fullWidth?: boolean;
}

const TabListContext = createContext<{ size: "sm" | "md"; type: TabType; fullWidth?: boolean }>({
    size: "sm",
    type: "button-brand",
});

export const TabList = <T extends object>({
    size = "sm",
    type = "button-brand",
    fullWidth,
    className,
    children,
    ...otherProps
}: TabListComponentProps<T>) => {
    const context = useSlottedContext(TabsContext);
    const orientation = context?.orientation ?? "horizontal";

    return (
        <TabListContext.Provider value={{ size, type, fullWidth }}>
            <AriaTabList
                {...otherProps}
                className={(state) =>
                    cx(
                        "group flex",
                        getListStyles({ size, fullWidth })[type],
                        orientation === "horizontal" &&
                            type === "underline" &&
                            "relative before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border-secondary",
                        typeof className === "function" ? className(state) : className,
                    )
                }
            >
                {children}
            </AriaTabList>
        </TabListContext.Provider>
    );
};

export const TabPanel = (props: ComponentPropsWithRef<typeof AriaTabPanel>) => {
    return (
        <AriaTabPanel
            {...props}
            className={(state) =>
                cx(
                    "outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                    typeof props.className === "function" ? props.className(state) : props.className,
                )
            }
        />
    );
};

interface TabComponentProps extends AriaTabProps {
    label?: ReactNode;
    children?: ReactNode | ((props: AriaTabRenderProps) => ReactNode);
}

export const Tab = (props: TabComponentProps) => {
    const { label, children, ...otherProps } = props;
    const { size = "sm", type = "button-brand", fullWidth } = useContext(TabListContext);

    return (
        <AriaTab
            {...otherProps}
            className={(prop) =>
                cx(
                    "z-10 flex h-max cursor-pointer items-center justify-center gap-2 rounded-md whitespace-nowrap text-quaternary transition duration-100 ease-linear",
                    fullWidth && "w-full flex-1",
                    sizes[size][type],
                    getTabStyles(prop)[type],
                    typeof props.className === "function" ? props.className(prop) : props.className,
                )
            }
        >
            {(state) => (
                <Fragment>{typeof children === "function" ? children(state) : children || label}</Fragment>
            )}
        </AriaTab>
    );
};

export const Tabs = ({ className, ...props }: ComponentPropsWithRef<typeof AriaTabs>) => {
    return (
        <AriaTabs
            keyboardActivation="manual"
            {...props}
            className={(state) => cx("flex w-full flex-col", typeof className === "function" ? className(state) : className)}
        />
    );
};

Tabs.Panel = TabPanel;
Tabs.List = TabList;
Tabs.Item = Tab;
