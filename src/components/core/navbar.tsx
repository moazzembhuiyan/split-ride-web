"use client";
import {
  ArrowDown01Icon,
  Car01Icon,
  Cash01Icon,
  CreditCardIcon,
  HandHelpingIcon,
  LanguageSkillIcon,
  LegalDocument01Icon,
  LockIcon,
  LogoutIcon,
  MapsGlobal01Icon,
  Menu01Icon,
  Message01Icon,
  Notification01Icon,
  ShieldUserIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useMe } from "@/hooks/shared/use-user";
import {
  useMyNotifications,
  useMarkAllNotificationsDone,
  useMarkNotificationDone,
} from "@/hooks/shared/use-notification";
import { useT } from "@/i18n";
import { notificationHref, PANEL_PREFIX } from "@/lib/notification-href";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "../ui/sheet";
import Help from "./privacy-pages/help";
import Language from "./privacy-pages/language";
import Me from "./privacy-pages/me";
import Privacy from "./privacy-pages/privacy";
import Refund from "./privacy-pages/refund";
import SavedPlaces from "./privacy-pages/saved-places";
import Security from "./privacy-pages/security";
import Terms from "./privacy-pages/terms";
import Vehicle from "./privacy-pages/vehicle";
import PaymentCards from "./privacy-pages/payment-cards";
import DriverEarnings from "@/app/driver/(view)/my-payments/page";

const passengerNavs = [
  { labelKey: "nav.bookRide", href: "/book" },
  { labelKey: "nav.myRides", href: "/my-rides" },
] as const;

const driverNavs = [
  { labelKey: "nav.home", href: "/driver" },
  { labelKey: "nav.myRides", href: "/driver/my-rides" },
  { labelKey: "nav.myPayments", href: "/driver/my-payments" },
  { labelKey: "nav.helpSupport", href: "/driver/help" },
] as const;

type NavContentProps = { driver?: boolean };

const sharedUserNavs = [
  {
    icon: LockIcon,
    labelKey: "nav.loginSecurity",
    value: "/security",
    content: (props: NavContentProps) => <Security {...props} />,
  },
  // {
  //   icon: ShieldUserIcon,
  //   labelKey: "nav.privacy",
  //   value: "/privacy",
  //   content: (props: NavContentProps) => <Privacy {...props} />,
  // },
  {
    icon: HandHelpingIcon,
    labelKey: "nav.helpSupport",
    value: "/help",
    content: (props: NavContentProps) => <Help {...props} embedded />,
  },
  {
    icon: LanguageSkillIcon,
    labelKey: "nav.language",
    value: "/language",
    content: (props: NavContentProps) => <Language {...props} />,
  },
];

const userNavs = [
  {
    icon: UserIcon,
    labelKey: "nav.personalInfo",
    value: "/me",
    content: (props: NavContentProps) => <Me {...props} />,
  },
  {
    icon: Cash01Icon,
    labelKey: "nav.refundAmount",
    value: "/refund",
    content: (props: NavContentProps) => <Refund {...props} />,
  },
  {
    icon: CreditCardIcon,
    labelKey: "Payment Cards",
    value: "/payment-cards",
    content: (props: NavContentProps) => <PaymentCards {...props} />,
  },
  ...sharedUserNavs,
  {
    icon: LegalDocument01Icon,
    labelKey: "nav.termsConditions",
    value: "/terms",
    content: (props: NavContentProps) => <Terms {...props} />,
  },
  // {
  //   icon: MapsGlobal01Icon,
  //   labelKey: "nav.savedPlaces",
  //   value: "/saved-places",
  //   content: (props: NavContentProps) => <SavedPlaces {...props} />,
  // },
];

const driverUserNavs = [
  {
    icon: UserIcon,
    labelKey: "nav.personalInfo",
    value: "/me",
    content: (props: NavContentProps) => <Me {...props} />,
  },
  // {
  //   icon: Cash01Icon,
  //   labelKey: "nav.refundAmount",
  //   value: "/refund",
  //   content: (props: NavContentProps) => <Refund {...props} />,
  // },
  {
    icon: Cash01Icon,
    labelKey: "nav.myPaymentsDriver",
    value: "/my-payments",
    content: () => <DriverEarnings />,
  },
  {
    icon: Car01Icon,
    labelKey: "nav.myVehicles",
    value: "/my-vehicles",
    content: (props: NavContentProps) => <Vehicle {...props} />,
  },
  ...sharedUserNavs,
];

type NavValue = (typeof userNavs | typeof driverUserNavs)[number]["value"];

function TopNavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Button
      className={cn(
        "bg-transparent text-foreground h-full! relative",
        active &&
        "text-transparent bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text",
      )}
      asChild
    >
      <Link href={href}>
        {label}
        {active && (
          <div className="absolute w-full bottom-0 left-0 h-2 bg-linear-to-r from-cyan-400 to-violet-500 rounded-t-4xl" />
        )}
      </Link>
    </Button>
  );
}

export default function Navbar({ driver }: { driver?: boolean }) {
  const path = usePathname();
  const t = useT();
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentDialog, setCurrentDialog] = React.useState<NavValue>("/me");
  const { data: meData } = useMe();
  const user = meData?.data;
  const displayName = user?.name ?? "—";
  const displayEmail = user?.email ?? "";
  const avatarSrc = user?.profileImage ?? "/user.png";

  const {
    data: notifData,
    isError: notifFailed,
    isFetching: notifFetching,
    refetch: refetchNotifs,
  } = useMyNotifications();
  const rideInProgress = /^\/driver\/my-rides\/.+/.test(path);
  const markOneAsDone = useMarkNotificationDone();
  const markAllDone = useMarkAllNotificationsDone();
  const notifications = notifData?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const activeNavs = driver ? driverNavs : passengerNavs;
  const activeUserNavs = driver ? driverUserNavs : userNavs;

  return (
    <>
      <nav className="h-16 border shadow rounded-b-2xl flex justify-between items-center p-4 sm:px-8 py-0! gap-4 w-full fixed top-0 left-0 right-0 bg-background z-50">
        <Image
          src="/logo.webp"
          alt="Logo"
          width={180}
          height={60}
          className="object-contain h-10 w-min hidden sm:block"
        />
        <div className="flex-1 justify-center items-center gap-4 hidden md:flex h-full">
          {activeNavs.map((nav) => (
            <TopNavLink
              key={nav.href}
              href={nav.href}
              label={t(nav.labelKey)}
              active={path === nav.href}
            />
          ))}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="flex md:hidden"
              aria-label={t("nav.openMenu")}
            >
              <HugeiconsIcon icon={Menu01Icon} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="px-6 py-5">
              <Image
                src="/logo.webp"
                alt="Logo"
                width={180}
                height={60}
                className="object-contain h-10 w-min"
              />
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-3 py-4">
              {activeNavs.map((nav) => (
                <SheetClose asChild key={nav.href}>
                  <Link
                    href={nav.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors",
                      path === nav.href &&
                      "text-transparent bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text bg-secondary",
                    )}
                  >
                    {t(nav.labelKey)}
                  </Link>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center justify-end gap-2">
          {/* Profile */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border"
              >
                <Avatar className="size-8">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                  <span className="text-sm font-medium">{displayName}</span>
                  {user?.isEmailVerified && (
                    <span className="text-xs text-transparent bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text font-medium">
                      {t("nav.verified")}
                    </span>
                  )}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-72 p-0 overflow-hidden"
            >
              {/* User header */}
              <div className="flex items-center gap-3 px-4 py-4 bg-linear-to-br from-cyan-500/10 to-violet-500/10 border-b">
                <Avatar className="size-12 ring-2 ring-primary/20">
                  <AvatarImage src={avatarSrc} alt={displayName} />
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{displayName}</p>
                  {user?.isEmailVerified && (
                    <p className="text-xs text-transparent bg-linear-to-r from-cyan-400 to-violet-500 bg-clip-text font-medium">
                      {t("nav.verifiedAccount")}
                    </p>
                  )}
                  {displayEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {displayEmail}
                    </p>
                  )}
                </div>
              </div>

              {/* Nav items */}
              <div className="p-2">
                {activeUserNavs.map((nav) => (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDialog(nav.value);
                      setIsOpen(true);
                    }}
                    key={nav.value}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left cursor-pointer ring-0 border-0 group"
                  >
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <HugeiconsIcon
                        className="size-4 text-primary"
                        icon={nav.icon}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {t(nav.labelKey)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="p-2 pt-0 border-t mt-1">
                <Link
                  href={"/logout"}
                  prefetch={false}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors group"
                >
                  <div className="size-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 group-hover:bg-destructive/20 transition-colors">
                    <HugeiconsIcon className="size-4" icon={LogoutIcon} />
                  </div>
                  <span className="text-sm font-medium">{t("nav.logout")}</span>
                </Link>
              </div>
            </PopoverContent>
          </Popover>
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="relative">
                <HugeiconsIcon icon={Notification01Icon} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              className="w-md max-w-[calc(100vw-1rem)] p-0"
            >
              <PopoverHeader className="px-4 py-3 border-b flex items-center justify-between">
                <PopoverTitle className="text-base font-semibold">
                  {t("nav.notifications")}
                </PopoverTitle>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => markAllDone.mutate()}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline disabled:opacity-50"
                    disabled={notifFetching}
                    onClick={() => void refetchNotifs()}
                  >
                    {notifFailed
                      ? t("common.tryAgain")
                      : t("common.refresh")}
                  </button>
                </div>
              </PopoverHeader>
              <div className="divide-y max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {notifFailed ? t("error.loadFailed") : "No notifications"}
                  </p>
                ) : (
                  notifications.map((notif) => {
                    const href = notificationHref(
                      notif,
                      driver ? "driver" : "passenger",
                      { rideInProgress },
                    );
                    const panel = href?.startsWith(PANEL_PREFIX)
                      ? href.slice(PANEL_PREFIX.length)
                      : undefined;
                    const inner = (
                      <>
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <HugeiconsIcon
                            icon={UserIcon}
                            className="size-4 text-primary"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {notif.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(notif.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}{" "}
                            ·{" "}
                            {new Date(notif.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              },
                            )}
                          </p>
                        </div>
                      </>
                    );
                    const className = cn(
                      "flex gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ",
                      !notif.read && "bg-primary/5",
                    );
                    const markAsRead = () => {
                      if (!notif.read) {
                        markOneAsDone.mutate(notif._id);
                      }
                    };
                    return href && !panel ? (
                      <Link
                        key={notif._id}
                        href={href}
                        className={className}
                        onClick={markAsRead}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        key={notif._id}
                        type="button"
                        className={cn(className, "w-full text-start")}
                        onClick={() => {
                          markAsRead();
                          if (panel) {
                            setCurrentDialog(panel as NavValue);
                            setIsOpen(true);
                          }
                        }}
                      >
                        {inner}
                      </button>
                    );
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button size="icon" variant="ghost" className="" asChild>
            <Link href="/message">
              <HugeiconsIcon icon={Message01Icon} />
            </Link>
          </Button>
        </div>
      </nav>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogContent className="h-[95dvh] sm:h-[80vh] w-full sm:min-w-[70dvw] max-w-full sm:max-w-[70dvw] overflow-hidden p-0">
          <DialogHeader className="hidden">
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <div className="h-full w-full rounded-lg flex flex-col sm:grid sm:grid-cols-5 overflow-hidden">
            {/* Mobile: popover nav picker */}
            <div className="sm:hidden flex items-center gap-2 p-3 border-b shrink-0">
              {(() => {
                const active = activeUserNavs.find(
                  (n) => n.value === currentDialog,
                );
                return (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm font-medium cursor-pointer ring-0 border-0 w-full"
                      >
                        {active && (
                          <HugeiconsIcon
                            className="size-4 text-primary shrink-0"
                            icon={active.icon}
                          />
                        )}
                        <span className="flex-1 text-left text-primary">
                          {active ? t(active.labelKey) : "Select"}
                        </span>
                        <HugeiconsIcon
                          className="size-4 text-muted-foreground shrink-0"
                          icon={ArrowDown01Icon}
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      side="bottom"
                      className="w-56 p-1"
                    >
                      {activeUserNavs.map((nav) => (
                        <button
                          type="button"
                          key={nav.value}
                          onClick={() => setCurrentDialog(nav.value)}
                          className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors cursor-pointer ring-0 border-0",
                            currentDialog === nav.value &&
                            "bg-secondary text-primary font-medium",
                          )}
                        >
                          <HugeiconsIcon
                            className="size-4 text-primary shrink-0"
                            icon={nav.icon}
                          />
                          {t(nav.labelKey)}
                        </button>
                      ))}
                      <div className="border-t mt-1 pt-1">
                        <Link
                          href="/logout"
                          prefetch={false}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <HugeiconsIcon
                            className="size-4 shrink-0"
                            icon={LogoutIcon}
                          />
                          {t("nav.logout")}
                        </Link>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })()}
            </div>
            {/* Desktop: vertical sidebar */}
            <div className="hidden sm:flex sm:flex-col space-y-1 p-3 overflow-y-auto">
              {activeUserNavs.map((nav) => (
                <button
                  type="button"
                  onClick={() => setCurrentDialog(nav.value)}
                  key={nav.value}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary w-full ring-0 border-0 cursor-pointer text-sm",
                    currentDialog === nav.value && "bg-secondary text-primary",
                  )}
                >
                  <HugeiconsIcon
                    className="size-5 text-primary shrink-0"
                    icon={nav.icon}
                  />
                  {t(nav.labelKey)}
                </button>
              ))}
              <Link
                href={"/logout"}
                  prefetch={false}
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-destructive/20 text-destructive text-sm"
              >
                <HugeiconsIcon className="size-5 shrink-0" icon={LogoutIcon} />
                {t("nav.logout")}
              </Link>
            </div>
            <div className="flex-1 sm:col-span-4 border-t sm:border-t-0 sm:border-l overflow-y-auto relative">
              {activeUserNavs
                .find((nav) => nav.value === currentDialog)
                ?.content({ driver })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="h-16"></div>
    </>
  );
}
