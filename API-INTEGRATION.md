# API Integration Guide

## Overview

This document tracks every API endpoint, its hook, and its integration status. Used during manual AI-assisted integration per page.

---

## Architecture

```
Postman endpoint
  → service fn (src/services/*.service.ts)       — pure fetch, no React
    → TanStack hook (src/hooks/**/*.ts)           — useQuery / useMutation
      → page/component
```

**Two fetch primitives:**
- `howl<T>(endpoint, opts?)` — JSON APIs (`Content-Type: application/json`)
- `prowl<T>(endpoint, opts)` — FormData APIs (file uploads, no Content-Type set)

Both auto-inject `token` cookie as `Authorization: Bearer <token>`.

**Base URL:** `NEXT_PUBLIC_SERVER_URL` + `/api` (see `.env.local.example`)

---

## Auth Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/auth/register` | POST | `authService.register` | `useRegister` | `auth/register` | ⬜ |
| `/auth/login-with-phone` | POST | `authService.loginWithPhone` | `useLoginWithPhone` | `auth/login` | ⬜ |
| `/auth/login-with-email` | POST | `authService.loginWithEmail` | `useLoginWithEmail` | `admin/auth/login` | ⬜ |
| `/auth/google` | POST | `authService.loginWithGoogle` | `useLoginWithGoogle` | `auth/login` | ⬜ |
| `/auth/apple` | POST | `authService.loginWithApple` | `useLoginWithApple` | `auth/login` | ⬜ |
| `/auth/forgot-password` | POST | `authService.forgotPassword` | `useForgotPassword` | `auth/forgot` | ⬜ |
| `/auth/reset-password` | POST | `authService.resetPassword` | `useResetPassword` | `auth/reset` | ⬜ |
| `/auth/change-password` | POST | `authService.changePassword` | `useChangePassword` | Settings | ⬜ |
| `/auth/logout` | POST | `authService.logout` | `useLogout` | Navbar/Settings | ⬜ |

---

## OTP Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/otp/verify?type=` | POST | `otpService.verifyOtp` | `useVerifyOtp(type)` | `auth/otp` | ⬜ |
| `/otp/send-otp-in-email` | POST | `otpService.sendOtpEmail` | `useSendOtpEmail` | `auth/otp` | ⬜ |
| `/otp/send-otp-via-token-in-phone` | POST | `otpService.sendOtpPhoneViaToken` | `useSendOtpPhoneViaToken` | `auth/otp` | ⬜ |
| `/otp/send-otp-via-direct-phone` | POST | `otpService.sendOtpPhoneDirect` | `useSendOtpPhoneDirect` | `auth/login` | ⬜ |

**OTP types:** `signup` | `forgot` | `login` | `changeEmail` | `changePhone`

---

## User Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/user/me` | GET | `userService.getMe` | `useMe` | Profile, Navbar | ⬜ |
| `/user/me` | PUT | `userService.updateMe` | `useUpdateMe` | Profile edit | ⬜ |
| `/user/change-email` | PUT | `userService.changeEmail` | `useChangeEmail` | Settings | ⬜ |
| `/user/me` (phone) | PUT | `userService.changePhone` | `useChangePhone` | Settings | ⬜ |
| `/user/location` | PUT | `userService.updateLocation` | `useUpdateLocation` | Map/Book | ⬜ |
| `/user/me` | DELETE | `userService.deleteMe` | `useDeleteMe` | Settings | ⬜ |
| `/user` | GET | `userService.getUsers` | `useUsers(query?)` | Admin/Users | ⬜ |
| `/user/:id` | GET | `userService.getUserById` | `useUserById(id)` | Admin/Users | ⬜ |
| `/user/:id` | PATCH | `userService.changeUserStatus` | `useChangeUserStatus(id)` | Admin/Users | ⬜ |

---

## Upload Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/upload` | POST (FormData) | `uploadService.uploadSingle` | `useUploadSingle` | Profile, KYC | ⬜ |
| `/upload/multiple` | POST (FormData) | `uploadService.uploadMultiple` | `useUploadMultiple` | KYC, Documents | ⬜ |

> Uses `prowl` — do NOT use `howl` for file uploads.

---

## Notification Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/notification` | GET | `notificationService.getMyNotifications` | `useMyNotifications` | Notification bell | ⬜ |
| `/notification` | PATCH | `notificationService.markAllDone` | `useMarkAllNotificationsDone` | Notifications | ⬜ |
| `/notification/:id` | DELETE | `notificationService.deleteOne` | `useDeleteNotification` | Notifications | ⬜ |
| `/notification/my-notifications` | DELETE | `notificationService.deleteMyAll` | `useDeleteMyNotifications` | Notifications | ⬜ |

---

## FAQ Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/faq?audience=` | GET | `faqService.getFaqs` | `useFaqs(audience?)` | Help, Admin/FAQ | ⬜ |
| `/faq` | POST | `faqService.createFaq` | `useCreateFaq` | Admin/FAQ | ⬜ |
| `/faq/:id` | PUT | `faqService.updateFaq` | `useUpdateFaq(id)` | Admin/FAQ | ⬜ |
| `/faq/:id` | DELETE | `faqService.deleteFaq` | `useDeleteFaq` | Admin/FAQ | ⬜ |

---

## Settings Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/setting/generals` | GET | `settingsService.getGenerals` | `useGeneralSettings` | Admin/Settings | ⬜ |
| `/setting/generals` | POST | `settingsService.updateGenerals` | `useUpdateGeneralSettings` | Admin/Settings | ⬜ |
| `/setting?key=` | GET | `settingsService.getByKey` | `useSettingByKey(key)` | Terms pages | ⬜ |
| `/setting/:key` | POST | `settingsService.updateByKey` | `useUpdateSettingByKey(key)` | Admin/Settings | ⬜ |

**Setting keys:** `userTramsAndCondition` | `providerTramsAndCondition`

---

## Support Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/supports` | POST | `supportService.createSupport` | `useCreateSupport` | Help/Support | ⬜ |
| `/supports` | GET | `supportService.getAll` | `useAllSupports` | Admin/Help | ⬜ |
| `/supports/:id` | POST | `supportService.sendMessage` | `useSendSupportMessage(id)` | Admin/Help | ⬜ |
| `/supports/:id` | DELETE | `supportService.deleteSupport` | `useDeleteSupport` | Admin/Help | ⬜ |

---

## Review Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/review` | POST | `reviewService.createReview` | `useCreateReview` | Post-ride | ⬜ |
| `/review/:userId` | GET | `reviewService.getByUserId` | `useReviewsByUser(userId)` | Driver/User profile | ⬜ |

---

## Chat & Messages Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/chats` | POST | `chatService.createChat` | `useCreateChat` | Ride detail | ⬜ |
| `/chats/my-chat-list` | GET | `chatService.getMyChatList` | `useMyChatList(search?)` | Messages | ⬜ |
| `/chats/booking/:id` | GET | `chatService.getChatByBookingId` | `useChatByBooking(id)` | Booking detail | ⬜ |
| `/chats/:id` | PATCH | `chatService.updateChatStatus` | `useUpdateChatStatus(id)` | Chat | ⬜ |
| `/chats/:id` | DELETE | `chatService.deleteChat` | — (admin only) | Admin | ⬜ |
| `/message/my-messages/:chatId` | GET | `chatService.getMessagesByChatId` | `useMessagesByChatId(id)` | Chat | ⬜ |
| `/messages/:id` | GET | `chatService.getMessageById` | — | Chat | ⬜ |
| `/messages/update/:id` | PATCH | `chatService.updateMessage` | `useUpdateMessage(id)` | Chat | ⬜ |
| `/messages/seen/:id` | PATCH | `chatService.markMessageSeen` | `useMarkMessageSeen` | Chat | ⬜ |
| `/messages/:id` | DELETE | `chatService.deleteMessage` | — (admin only) | Admin | ⬜ |

---

## Saved Places Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/save-places` | GET | `savePlaceService.getSavedPlaces` | `useSavedPlaces` | Book/Address | ⬜ |
| `/save-places` | POST | `savePlaceService.createSavedPlace` | `useCreateSavedPlace` | Book/Address | ⬜ |
| `/save-places/:id` | PUT | `savePlaceService.updateSavedPlace` | `useUpdateSavedPlace(id)` | Saved Places | ⬜ |
| `/save-places/pinned/:id` | PATCH | `savePlaceService.pinSavedPlace` | `usePinSavedPlace` | Saved Places | ⬜ |
| `/save-places/:id` | DELETE | `savePlaceService.deleteSavedPlace` | `useDeleteSavedPlace` | Saved Places | ⬜ |

---

## Ride Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/ride` | POST | `rideService.createRide` | `useCreateRide` | Book/Confirm | ⬜ |
| `/ride/my-rides` | GET | `rideService.getMyRides` | `useMyRides` | My Rides (user) | ⬜ |
| `/ride/:id` | GET | `rideService.getRideById` | `useRideById(id)` | Ride detail | ⬜ |
| `/ride/driver-rides?status=` | GET | `rideService.getDriverRides` | `useDriverRides(status?)` | Driver/Rides | ⬜ |
| `/passenger/ride-requests` | GET | `rideService.getMyRideRequests` | `useMyRideRequests` | Driver/Requests | ⬜ |
| `/passenger/:id` | GET | `rideService.getRideRequestById` | `useRideRequestById(id)` | Driver/Request detail | ⬜ |
| `/passenger/ride/:rideId` | GET | `rideService.getPassengersByRideId` | `usePassengersByRide(rideId)` | Driver/Ride detail | ⬜ |

**Ride types:** `split` | `private`
**Driver ride statuses:** `accepted` | `started` | `completed`

---

## Booking Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/bookings/my-bookings` | GET | `bookingService.getMyBookings` | `useMyBookings(status?)` | My Rides | ⬜ |
| `/bookings/:id` | GET | `bookingService.getBookingById` | `useBookingById(id)` | Ride detail | ⬜ |
| `/bookings/status/:id` | PATCH | `bookingService.changeBookingStatus` | `useChangeBookingStatus(id)` | Ride detail | ⬜ |
| `/bookings` | GET | `bookingService.getAllBookings` | `useAllBookings` | Admin/Bookings | ⬜ |

**Booking statuses:** `upcoming` | `ongoing` | `completed` | `cancelled`

---

## Payment Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/payments/checkout` | POST | `paymentService.checkout` | `useCheckout` | Book/Confirm | ⬜ |
| `/payments/confirm-payment` | POST | `paymentService.confirmPayment` | `useConfirmPayment` | Payment | ⬜ |
| `/refunds/my-refund` | GET | `paymentService.getMyRefunds` | `useMyRefunds` | My Rides | ⬜ |
| `/payments` | GET | `paymentService.getAllPayments` | `useAllPayments(query?)` | Admin/Transactions | ⬜ |
| `/payments/:id` | GET | `paymentService.getPaymentById` | `usePaymentById(id)` | Admin/Transactions | ⬜ |
| `/payments/refound-payment` | PATCH | `paymentService.refundPayment` | `useRefundPayment` | Admin/Transactions | ⬜ |
| `/refunds` | GET | `paymentService.getAllRefunds` | `useAllRefunds` | Admin | ⬜ |
| `/refunds/:id` | GET | `paymentService.getRefundById` | `useRefundById(id)` | Admin | ⬜ |
| `/refunds/status/:id` | PATCH | `paymentService.changeRefundStatus` | `useChangeRefundStatus(id)` | Admin | ⬜ |
| `/refunds/:id` | DELETE | `paymentService.deleteRefund` | — | Admin | ⬜ |

---

## Vehicle Domain (Driver)

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/vehicles` | GET | `vehicleService.getMyVehicles` | `useMyVehicles` | Driver/Profile | ⬜ |
| `/vehicles` | POST | `vehicleService.addVehicle` | `useAddVehicle` | Driver/Register | ⬜ |
| `/vehicles/multiple` | POST | `vehicleService.addMultipleVehicles` | `useAddMultipleVehicles` | Driver/Register | ⬜ |
| `/vehicles/:id` | PUT | `vehicleService.updateVehicle` | `useUpdateVehicle(id)` | Driver/Vehicle | ⬜ |
| `/vehicles/:id` | DELETE | `vehicleService.deleteVehicle` | `useDeleteVehicle` | Driver/Vehicle | ⬜ |

---

## KYC Domain (Driver/Admin)

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/provider` | POST | `kycService.setupKyc` | `useSetupKyc` | Driver/Register | ⬜ |
| `/provider` | GET | `kycService.getAllKyc` | `useAllKyc` | Admin/Drivers | ⬜ |
| `/provider/:id` | GET | `kycService.getKycById` | `useKycById(id)` | Admin/Driver detail | ⬜ |
| `/provider/:id` | PATCH | `kycService.changeKycStatus` | `useChangeKycStatus(id)` | Admin/Drivers | ⬜ |

**KYC statuses:** `pending` | `verified` | `rejected`

---

## Stripe Domain (Driver)

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/stripe/check-connection` | GET | `stripeService.checkConnection` | `useStripeConnectionCheck` | Driver/Payments | ⬜ |
| `/stripe/account-status` | GET | `stripeService.getAccountStatus` | `useStripeAccountStatus` | Driver/Payments | ⬜ |
| `/stripe/connect` | POST | `stripeService.connectStripe` | `useConnectStripe` | Driver/Payments | ⬜ |
| `/stripe/connect-existing` | POST | `stripeService.connectExisting` | `useConnectExistingStripe` | Driver/Payments | ⬜ |
| `/stripe/disconnect` | DELETE | `stripeService.disconnect` | `useDisconnectStripe` | Driver/Payments | ⬜ |

---

## Withdraw Domain (Driver/Admin)

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/withdraw` | POST | `withdrawService.createWithdraw` | `useCreateWithdraw` | Driver/Payments | ⬜ |
| `/withdraw/my-withdraws` | GET | `withdrawService.getMyWithdraws` | `useMyWithdraws(query?)` | Driver/Payments | ⬜ |
| `/withdraw` | GET | `withdrawService.getAllWithdraws` | `useAllWithdraws` | Admin/Withdraw | ⬜ |
| `/withdraw/:id` | GET | `withdrawService.getWithdrawById` | `useWithdrawById(id)` | Admin/Withdraw | ⬜ |
| `/withdraw/:id` | PATCH | `withdrawService.changeWithdrawStatus` | `useChangeWithdrawStatus(id)` | Admin/Withdraw | ⬜ |

**Withdraw statuses (admin action):** `proceed` | `cancelled`

---

## Admin Domain

| Endpoint | Method | Service fn | Hook | Page | Status |
|---|---|---|---|---|---|
| `/meta` | GET | `adminService.getMeta` | `useAdminMeta` | Admin/Dashboard | ⬜ |
| `/account-deletion` | GET | `adminService.getAllAccountDeletions` | `useAllAccountDeletions` | Admin/Users | ⬜ |
| `/account-deletion/:id` | GET | `adminService.getAccountDeletionById` | `useAccountDeletionById(id)` | Admin/Users | ⬜ |
| `/account-deletion/:id` | DELETE | `adminService.deleteAccountDeletion` | `useDeleteAccountDeletion` | Admin/Users | ⬜ |

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not integrated |
| 🟡 | In progress |
| ✅ | Integrated |
| ❌ | Blocked / needs backend fix |

---

## Integration Workflow (per page)

1. Identify which hooks this page needs from the table above
2. Mark them 🟡 in this doc
3. Import hook into page component
4. Wire data to UI
5. Handle loading/error states
6. Mark ✅ when done

---

## Token Storage

Token stored in cookie named `token`. `howl` and `prowl` auto-read it — no manual passing needed. After login, set the cookie:

```ts
// example (react-cookie)
const [, setCookie] = useCookies(["token"]);
setCookie("token", data.data.tokens.accessToken, { path: "/" });
```

---

## File Structure

```
src/
├── lib/
│   ├── api.ts          howl (JSON) + prowl (FormData)
│   └── utils.ts        cn()
├── types/
│   ├── base.ts         ApiResponse<T>, Paginator<T>
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── otp.types.ts
│   ├── upload.types.ts
│   ├── notification.types.ts
│   ├── faq.types.ts
│   ├── settings.types.ts
│   ├── support.types.ts
│   ├── review.types.ts
│   ├── chat.types.ts
│   ├── save-place.types.ts
│   ├── ride.types.ts
│   ├── booking.types.ts
│   ├── payment.types.ts
│   ├── driver.types.ts
│   └── admin.types.ts
├── services/
│   ├── auth.service.ts
│   ├── otp.service.ts
│   ├── user.service.ts
│   ├── upload.service.ts
│   ├── notification.service.ts
│   ├── faq.service.ts
│   ├── settings.service.ts
│   ├── support.service.ts
│   ├── review.service.ts
│   ├── chat.service.ts
│   ├── save-place.service.ts
│   ├── ride.service.ts
│   ├── booking.service.ts
│   ├── payment.service.ts
│   ├── driver.service.ts   (vehicles, kyc, stripe, withdraw)
│   └── admin.service.ts
└── hooks/
    ├── auth/
    │   ├── use-auth.ts
    │   └── use-otp.ts
    ├── booking/
    │   ├── use-ride.ts
    │   ├── use-booking.ts
    │   ├── use-save-place.ts
    │   └── use-payment.ts
    ├── driver/
    │   ├── use-driver-ride.ts
    │   ├── use-vehicle.ts
    │   ├── use-kyc.ts
    │   ├── use-stripe.ts
    │   └── use-withdraw.ts
    ├── admin/
    │   └── use-admin.ts
    └── shared/
        ├── use-user.ts
        ├── use-upload.ts
        ├── use-notification.ts
        ├── use-faq.ts
        ├── use-settings.ts
        ├── use-support.ts
        ├── use-review.ts
        └── use-chat.ts
```
