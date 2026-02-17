import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    backgroundColor: '#ffffff', 
    fontFamily: 'Helvetica' 
  },
  // Company Branding Header
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: 2,
    borderBottomColor: '#1e293b',
    paddingBottom: 15,
    marginBottom: 20,
  },
  companyName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4
  },
  addressBox: {
    maxWidth: '60%',
  },
  contactBox: {
    // alignItems: 'right',
    textAlign: 'right',
  },
  contactText: { 
    fontSize: 8, 
    color: '#64748b', 
    marginBottom: 2 
  },
  websiteLink: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ea580c', // Orange accent
    marginTop: 4
  },

  // Document Title Section
  titleSection: {
    marginBottom: 25,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
  },
  documentTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  bunkSubtitle: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2
  },

  // Summary Grid
  summaryRow: { 
    flexDirection: 'row', 
    gap: 12,
    marginBottom: 30 
  },
  summaryItem: { 
    flex: 1,
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  summaryLabel: { 
    fontSize: 7, 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    marginBottom: 5,
    fontWeight: 'bold'
  },
  summaryValue: { 
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#0f172a'
  },

  // Table Styling
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#1e293b', 
    padding: 8,
    borderRadius: 4,
    marginBottom: 5
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9', 
    paddingVertical: 10, 
    alignItems: 'center' 
  },
  
  headerText: { 
    fontWeight: 'bold', 
    fontSize: 8, 
    textTransform: 'uppercase',
    color: '#ffffff'
  },
  rowText: { 
    fontSize: 9, 
    color: '#334155' 
  },
  vehicleNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  amountBold: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Column Widths
  colDate: { width: '15%' },
  colIdentity: { width: '40%' },
  colType: { width: '15%' },
  colAmount: { width: '30%', textAlign: 'right' },
  
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    textAlign: 'center', 
    fontSize: 8, 
    color: '#94a3b8',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10
  },
  computerGenerated: {
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    fontWeight: 'bold'
  }
});

export const FuelStatementPDF = ({ transactions, summary, bunkName }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* BRAND HEADER */}
      <View style={styles.brandHeader}>
        <View style={styles.addressBox}>
          <Text style={styles.companyName}>Aswath Hollow Bricks</Text>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#475569', marginBottom: 5 }}>& Lorry Service</Text>
          <Text style={styles.contactText}>SS Tower, Pandiannagar Bus Stop</Text>
          <Text style={styles.contactText}>Tiruppur, 641 602</Text>
        </View>
        <View style={styles.contactBox}>
          <Text style={styles.contactText}>bricksync0001@gmail.com</Text>
          <Text style={styles.contactText}>+91 98240 48181 | 98430 83521</Text>
          <Text style={styles.websiteLink}>www.aswath.online</Text>
        </View>
      </View>

      {/* DOCUMENT TITLE */}
      <View style={styles.titleSection}>
        <Text style={styles.documentTitle}>Fuel Settlement Statement</Text>
        <Text style={styles.bunkSubtitle}>Station: {bunkName} | Date: {new Date().toLocaleDateString('en-IN')}</Text>
      </View>

      {/* SUMMARY BOXES */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Fuel Usage</Text>
          <Text style={styles.summaryValue}>₹{summary.totalFuel.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 4, borderLeftColor: '#059669' }]}>
          <Text style={styles.summaryLabel}>Total Amount Paid</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>₹{summary.totalPaid.toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.summaryItem, { borderLeftWidth: 4, borderLeftColor: '#ea580c', backgroundColor: '#fff7ed' }]}>
          <Text style={styles.summaryLabel}>Net Outstanding</Text>
          <Text style={[styles.summaryValue, { color: '#ea580c' }]}>₹{summary.outstanding.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.headerText, styles.colDate]}>Date</Text>
        <Text style={[styles.headerText, styles.colIdentity]}>Vehicle / Description</Text>
        <Text style={[styles.headerText, styles.colType]}>Type</Text>
        <Text style={[styles.headerText, styles.colAmount]}>Amount (INR)</Text>
      </View>

      {/* TRANSACTIONS */}
      {transactions.map((tx: any, i: number) => (
        <View key={i} style={styles.tableRow} wrap={false}>
          <Text style={[styles.rowText, styles.colDate]}>
            {new Date(tx.sortDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
          
          <View style={styles.colIdentity}>
            {tx.type === 'fuel' ? (
              <>
                <Text style={styles.vehicleNumber}>{tx.vehicle?.vehicleNumber}</Text>
                <Text style={{ fontSize: 7, color: '#64748b' }}>{tx.vehicle?.vehicleName} | {tx.volume} Litres</Text>
              </>
            ) : (
              <Text style={[styles.rowText, { fontStyle: 'italic' }]}>{tx.description || 'Station Settlement'}</Text>
            )}
          </View>

          <Text style={[styles.rowText, styles.colType, { 
            color: tx.type === 'fuel' ? '#f59e0b' : '#10b981', 
            fontWeight: 'bold',
            fontSize: 8
          }]}>
            {tx.type === 'fuel' ? 'FUEL ENTRY' : 'PAID'}
          </Text>

          <Text style={[
            styles.colAmount, 
            styles.amountBold, 
            { color: tx.type === 'statement' ? '#059669' : '#0f172a' }
          ]}>
            {tx.type === 'statement' ? '(-) ' : ''}₹{tx.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      ))}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text>Aswath Hollow Bricks & Lorry Service - Quality & Trust</Text>
        <Text style={styles.computerGenerated}>*** This is a computer generated bill. No signature required. ***</Text>
      </View>

    </Page>
  </Document>
);