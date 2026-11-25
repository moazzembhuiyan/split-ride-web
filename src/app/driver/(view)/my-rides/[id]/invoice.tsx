"use client";

import {
  Page as PdfPage,
  Text,
  View,
  Image,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 36,
    fontSize: 7,
    color: "#4b5563",
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },

  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  logo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },

  documentInfo: {
    alignItems: "flex-end",
  },

  documentNumber: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 5,
  },

  infoRow: {
    flexDirection: "row",
    marginBottom: 2,
  },

  infoLabel: {
    fontWeight: "bold",
    color: "#6b7280",
  },

  infoValue: {
    color: "#6b7280",
    marginLeft: 3,
  },

  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  party: {
    width: "43%",
  },

  seller: {
    alignItems: "flex-end",
  },

  partyTitle: {
    fontWeight: "bold",
    fontSize: 7,
    color: "#4b5563",
    marginBottom: 3,
  },

  partyName: {
    fontWeight: "bold",
    fontSize: 8,
    color: "#374151",
    marginBottom: 2,
  },

  partyText: {
    fontSize: 6.5,
    lineHeight: 1.35,
    color: "#6b7280",
  },

  period: {
    marginTop: 15,
    marginBottom: 8,
    fontSize: 7,
    color: "#6b7280",
  },

  table: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#d1d5db",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 0.5,
    borderBottomColor: "#d1d5db",
    minHeight: 24,
    alignItems: "center",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 30,
    alignItems: "center",
  },

  cell: {
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRightWidth: 0.5,
    borderRightColor: "#d1d5db",
    justifyContent: "center",
  },

  lastCell: {
    borderRightWidth: 0,
  },

  headerText: {
    fontSize: 6.2,
    fontWeight: "bold",
    color: "#4b5563",
  },

  cellText: {
    fontSize: 6.5,
    color: "#4b5563",
  },

  description: {
    width: "29%",
  },

  quantity: {
    width: "11%",
    textAlign: "center",
  },

  unitPrice: {
    width: "18%",
    textAlign: "right",
  },

  sum: {
    width: "17%",
    textAlign: "right",
  },

  vat: {
    width: "12%",
    textAlign: "right",
  },

  total: {
    width: "13%",
    textAlign: "right",
  },

  totals: {
    marginTop: 12,
    marginLeft: "62%",
    width: "38%",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  totalLabel: {
    color: "#6b7280",
    fontSize: 7,
  },

  totalValue: {
    color: "#374151",
    fontSize: 7,
  },

  grandTotalLabel: {
    fontWeight: "bold",
    color: "#374151",
    fontSize: 8,
  },

  grandTotalValue: {
    fontWeight: "bold",
    color: "#374151",
    fontSize: 8,
  },

  paymentBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#9ca3af",
    padding: 9,
  },

  payable: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#22a06b",
    marginBottom: 12,
  },

  paymentTitle: {
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 5,
  },

  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },

  paymentLabel: {
    width: 82,
    fontSize: 6,
    color: "#6b7280",
  },

  paymentValue: {
    flex: 1,
    fontSize: 6,
    color: "#4b5563",
  },

  reference: {
    marginTop: 5,
    fontSize: 6.5,
    fontWeight: "bold",
    color: "#4b5563",
  },

  note: {
    marginTop: 9,
    fontSize: 5.5,
    color: "#9ca3af",
  },

  bankDetails: {
    marginTop: 9,
  },

  bankText: {
    fontSize: 5.8,
    lineHeight: 1.45,
    color: "#9ca3af",
  },
});

type InvoicePDFProps = {
  data: any;
};

const money = (value: number | null | undefined) =>
  Number(value ?? 0).toFixed(2);

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const addDays = (value: string | null | undefined, days: number) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  date.setDate(date.getDate() + days);

  return formatDate(date.toISOString());
};

export default function InvoicePDF({ data }: InvoicePDFProps) {
  const overview = data?.invoiceOverview ?? {};

  const driver = overview.driver ?? data?.driverId ?? {};
  const invoiceProfile = driver.invoiceProfile ?? {};

  const passenger = data?.passengers?.[0]?.userId ?? {};

  const passengerData = data?.passengers?.[0] ?? {};

  const fare = passengerData?.fareBreakdown ?? {};

  const payment = overview?.payments?.[0] ?? data?.payment ?? {};

  const booking = passengerData?.booking ?? data?.booking ?? {};

  const rideReference = overview?.rideReference ?? data?.id ?? data?._id ?? "—";

  const paymentReference =
    payment?.paymentShortId ??
    payment?.shortId ??
    booking?.bookingReference ??
    "—";

  const totalAmount =
    overview?.totals?.platformReceived ??
    payment?.amount ??
    booking?.totalFare ??
    passengerData?.totalFare ??
    0;

  const driverEarning =
    overview?.totals?.driverEarning ??
    payment?.providerEarning ??
    data?.driverEarningAmount ??
    0;

  const platformFee =
    overview?.totals?.platformFeeAmount ??
    payment?.platformCommission ??
    data?.platformCommissionAmount ??
    0;

  const vatAmount =
    overview?.totals?.vatAmount ?? fare?.vatAmount ?? fare?.vat ?? 0;

  const netAmount = Math.max(totalAmount - vatAmount, 0);

  const distance = passengerData?.estimatedDistanceKm ?? 0;

  const duration = passengerData?.estimatedDurationMinutes ?? 0;

  const quantity = passengerData?.requestedSeats ?? 1;

  const unitPrice = quantity > 0 ? totalAmount / quantity : totalAmount;

  return (
    <Document
      title={`Invoice ${rideReference}`}
      author={invoiceProfile?.companyName ?? "Split Ride"}
      subject="Ride Invoice"
    >
      <PdfPage size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.top}>
          <Image src="/logo.png" style={styles.logo} />

          <View style={styles.documentInfo}>
            <Text style={styles.documentNumber}>
              Document no. {rideReference}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>
                {formatDate(overview?.rideDate ?? data?.createdAt)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Due date:</Text>
              <Text style={styles.infoValue}>
                {addDays(overview?.rideDate ?? data?.createdAt, 7)}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={styles.infoValue}>
                {overview?.rideStatus ?? data?.status ?? "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Recipient / Seller */}
        <View style={styles.parties}>
          {/* Passenger / Recipient */}
          <View style={styles.party}>
            <Text style={styles.partyTitle}>Recipient:</Text>

            <Text style={styles.partyName}>{passenger?.name ?? "—"}</Text>

            <Text style={styles.partyText}>{passenger?.email ?? "—"}</Text>

            <Text style={styles.partyText}>{passenger?.phone ?? "—"}</Text>

            <Text style={styles.partyText}>
              Booking:{" "}
              {booking?.shortId ?? passengerData?.bookingShortId ?? "—"}
            </Text>
          </View>

          {/* Driver / Seller */}
          <View style={[styles.party, styles.seller]}>
            <Text style={styles.partyTitle}>Seller:</Text>

            <Text style={styles.partyName}>
              {invoiceProfile?.companyName ?? driver?.name ?? "—"}
            </Text>

            <Text style={styles.partyText}>
              {invoiceProfile?.companyReg
                ? `Reg. code: ${invoiceProfile.companyReg}`
                : (driver?.address ?? "—")}
            </Text>

            <Text style={styles.partyText}>
              {invoiceProfile?.vatNumber
                ? `VAT no.: ${invoiceProfile.vatNumber}`
                : (driver?.email ?? "—")}
            </Text>

            <Text style={styles.partyText}>{driver?.phone ?? "—"}</Text>
          </View>
        </View>

        {/* Ride period */}
        <Text style={styles.period}>
          Ride: {overview?.rideDate ?? data?.departureDate ?? "—"} at{" "}
          {overview?.rideTime ?? data?.departureTime ?? "—"}
        </Text>

        {/* Invoice table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.cell, styles.description]}>
              <Text style={styles.headerText}>Item</Text>
            </View>

            <View style={[styles.cell, styles.quantity]}>
              <Text style={styles.headerText}>Quantity</Text>
            </View>

            <View style={[styles.cell, styles.unitPrice]}>
              <Text style={styles.headerText}>Unit price</Text>
            </View>

            <View style={[styles.cell, styles.sum]}>
              <Text style={styles.headerText}>Sum</Text>
            </View>

            <View style={[styles.cell, styles.vat]}>
              <Text style={styles.headerText}>VAT</Text>
            </View>

            <View style={[styles.cell, styles.total, styles.lastCell]}>
              <Text style={styles.headerText}>Total</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.cell, styles.description]}>
              <Text style={styles.cellText}>Ride {rideReference}</Text>

              <Text style={styles.cellText}>
                {overview?.pickup?.address ?? "—"}
              </Text>

              <Text style={styles.cellText}>
                → {overview?.destination?.address ?? "—"}
              </Text>
            </View>

            <View style={[styles.cell, styles.quantity]}>
              <Text style={styles.cellText}>{quantity}</Text>
            </View>

            <View style={[styles.cell, styles.unitPrice]}>
              <Text style={styles.cellText}>€{money(unitPrice)}</Text>
            </View>

            <View style={[styles.cell, styles.sum]}>
              <Text style={styles.cellText}>€{money(netAmount)}</Text>
            </View>

            <View style={[styles.cell, styles.vat]}>
              <Text style={styles.cellText}>€{money(vatAmount)}</Text>
            </View>

            <View style={[styles.cell, styles.total, styles.lastCell]}>
              <Text style={styles.cellText}>€{money(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>

            <Text style={styles.totalValue}>€{money(netAmount)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT</Text>

            <Text style={styles.totalValue}>€{money(vatAmount)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>

            <Text style={styles.grandTotalValue}>€{money(totalAmount)}</Text>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.paymentBox}>
          <Text style={styles.payable}>To be paid: €{money(totalAmount)}</Text>

          <Text style={styles.paymentTitle}>Payment details</Text>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment method:</Text>

            <Text style={styles.paymentValue}>{payment?.method ?? "—"}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment status:</Text>

            <Text style={styles.paymentValue}>
              {payment?.status ?? booking?.paymentStatus ?? "—"}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Transaction ID:</Text>

            <Text style={styles.paymentValue}>
              {payment?.transactionId ?? "—"}
            </Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment reference:</Text>

            <Text style={styles.paymentValue}>{paymentReference}</Text>
          </View>

          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Amount paid:</Text>

            <Text style={styles.paymentValue}>
              €{money(payment?.amount ?? booking?.amountPaid ?? totalAmount)}
            </Text>
          </View>

          <Text style={styles.reference}>Ride reference: {rideReference}</Text>
        </View>

        {/* Ride information */}
        <Text style={styles.note}>
          Distance: {Number(distance).toFixed(2)} km
          {"  "}•{"  "}
          Duration: {duration} min
          {"  "}•{"  "}
          Ride type: {overview?.rideType ?? data?.type ?? "—"}
        </Text>

        {/* Driver earning / platform fee */}
        <View style={styles.bankDetails}>
          <Text style={styles.bankText}>
            Driver earning: €{money(driverEarning)}
          </Text>

          <Text style={styles.bankText}>
            Platform fee: €{money(platformFee)}
          </Text>

          <Text style={styles.bankText}>
            Vehicle: {data?.vehicleId?.name ?? "—"}
            {data?.vehicleId?.number ? ` (${data.vehicleId.number})` : ""}
          </Text>

          <Text style={styles.bankText}>
            Seats: {data?.vehicleId?.seats ?? data?.totalSeats ?? "—"}
          </Text>
        </View>
      </PdfPage>
    </Document>
  );
}
