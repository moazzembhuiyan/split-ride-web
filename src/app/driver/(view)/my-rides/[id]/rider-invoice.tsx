import {
  Page as PdfPage,
  Text,
  View,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 38,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#222",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 26,
  },

  headerLeft: {
    width: "45%",
  },

  headerRight: {
    width: "45%",
    alignItems: "flex-end",
  },

  invoiceTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 12,
  },

  invoiceMeta: {
    fontSize: 9,
    marginBottom: 5,
  },

  // Recipient / provider
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  recipientSection: {
    width: "45%",
  },

  providerSection: {
    width: "45%",
    alignItems: "flex-end",
  },

  label: {
    fontSize: 8,
    marginBottom: 5,
  },

  recipientName: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    width: 95,
    fontSize: 9,
  },

  providerBox: {
    padding: 8,
    width: 210,
    alignItems: "flex-end",
  },

  providerName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  providerText: {
    fontSize: 8,
    marginBottom: 3,
  },

  // Ride information
  rideInfo: {
    marginBottom: 20,
  },

  rideInfoText: {
    fontSize: 8,
  },

  // Table
  table: {
    width: "100%",
    borderWidth: 0.7,
    borderColor: "#555",
  },

  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: "#555",
    minHeight: 20,
    alignItems: "center",
  },

  tableRow: {
    flexDirection: "row",
    minHeight: 20,
    alignItems: "center",
  },

  tableCell: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRightWidth: 0.7,
    borderRightColor: "#555",
  },

  lastCell: {
    borderRightWidth: 0,
  },

  titleColumn: {
    width: "50%",
  },

  amountColumn: {
    width: "16.66%",
    textAlign: "right",
  },

  headerText: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  cellText: {
    fontSize: 8,
  },

  // Totals
  totalsWrapper: {
    marginTop: 20,
    alignItems: "flex-end",
  },

  totals: {
    width: 220,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  totalLabel: {
    fontSize: 8,
  },

  totalValue: {
    fontSize: 8,
    textAlign: "right",
  },

  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 14,
  },

  grandTotalLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },

  grandTotalValue: {
    fontSize: 9,
    fontWeight: "bold",
  },

  // Payment
  payment: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 5,
  },

  paymentLabel: {
    fontSize: 8,
    fontWeight: "bold",
  },

  paymentMethod: {
    fontSize: 8,
    fontWeight: "bold",
  },
});

type RideInvoiceProps = {
  ride: any;
};

export default function RideInvoice({ ride }: RideInvoiceProps) {
  const invoice = ride?.invoiceOverview;

  const passenger = ride.passengers?.[0];

  const driver = invoice?.driver ?? ride.driverId;

  const total = Number(
    invoice?.payments?.[0]?.amount ??
      ride.totalCollectedAmount ??
      passenger?.totalFare ??
      0,
  );

  const vat = Number(passenger?.vat ?? 0);

  const amountBeforeVat = Number(
    passenger?.fareBreakdown?.netBeforeVat ?? total - vat,
  );

  const paymentMethod =
    invoice?.payments?.[0]?.method ?? ride.payment?.method ?? "card";

  const paymentMethodLabel =
    paymentMethod === "card"
      ? "Card"
      : paymentMethod === "google_pay"
        ? "Google Pay"
        : paymentMethod;

  const formatDate = (date?: string) => {
    if (!date) return "";

    const parsed = new Date(date);

    return parsed.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <Document>
      <PdfPage size="A4" orientation="landscape" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />

          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>
              Invoice no. {invoice?.rideReference ?? ride.id}
            </Text>

            <Text style={styles.invoiceMeta}>
              Date: {formatDate(ride.departureDate)}
            </Text>
          </View>
        </View>

        {/* RECIPIENT / DRIVER */}
        <View style={styles.parties}>
          <View style={styles.recipientSection}>
            <Text style={styles.label}>Recipient:</Text>

            <Text style={styles.recipientName}>
              {passenger?.userId?.name ??
                ride.rideCreatedBy?.name ??
                "Customer"}
            </Text>
          </View>

          <View style={styles.providerSection}>
            <View style={styles.providerBox}>
              <Text style={styles.providerName}>
                {driver?.name ?? "Driver"}
              </Text>

              {driver?.address && (
                <Text style={styles.providerText}>{driver.address}</Text>
              )}

              {driver?.phone && (
                <Text style={styles.providerText}>{driver.phone}</Text>
              )}

              {driver?.invoiceProfile?.companyName && (
                <Text style={styles.providerText}>
                  {driver.invoiceProfile.companyName}
                </Text>
              )}

              {driver?.invoiceProfile?.vatNumber && (
                <Text style={styles.providerText}>
                  VAT: {driver.invoiceProfile.vatNumber}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* RIDE */}
        <View style={styles.rideInfo}>
          <Text style={styles.rideInfoText}>
            Start: {invoice?.pickup?.address ?? "—"} ({ride.departureDate}{" "}
            {ride.departureTime})
          </Text>

          <Text style={[styles.rideInfoText, { marginTop: 4 }]}>
            Destination: {invoice?.destination?.address ?? "—"}
          </Text>
        </View>

        {/* FARE TABLE */}
        <View style={styles.table}>
          {/* HEADER */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.titleColumn]}>
              <Text style={styles.headerText}>Title</Text>
            </View>

            <View style={[styles.tableCell, styles.amountColumn]}>
              <Text style={styles.headerText}>Sum (EUR)</Text>
            </View>

            <View style={[styles.tableCell, styles.amountColumn]}>
              <Text style={styles.headerText}>VAT 9%</Text>
            </View>

            <View
              style={[styles.tableCell, styles.amountColumn, styles.lastCell]}
            >
              <Text style={styles.headerText}>Total sum (EUR)</Text>
            </View>
          </View>

          {/* TRIP FEE */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.titleColumn]}>
              <Text style={styles.cellText}>Trip Fee</Text>
            </View>

            <View style={[styles.tableCell, styles.amountColumn]}>
              <Text style={styles.cellText}>{amountBeforeVat.toFixed(2)}</Text>
            </View>

            <View style={[styles.tableCell, styles.amountColumn]}>
              <Text style={styles.cellText}>{vat.toFixed(2)}</Text>
            </View>

            <View
              style={[styles.tableCell, styles.amountColumn, styles.lastCell]}
            >
              <Text style={styles.cellText}>{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* TOTALS */}
        <View style={styles.totalsWrapper}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total (EUR):</Text>

              <Text style={styles.totalValue}>
                {amountBeforeVat.toFixed(2)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT 9%:</Text>

              <Text style={styles.totalValue}>{vat.toFixed(2)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>
                Total including VAT (EUR):
              </Text>

              <Text style={styles.grandTotalValue}>{total.toFixed(2)}</Text>
            </View>

            {/* PAYMENT */}
            <View style={styles.payment}>
              <Text style={styles.paymentLabel}>Charged</Text>

              <Text style={styles.paymentMethod}>{paymentMethodLabel}</Text>

              <Text style={styles.paymentMethod}>{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </PdfPage>
    </Document>
  );
}
