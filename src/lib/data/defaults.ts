/** Default seed departments — mirrored by the database seed. */
export const defaultDepartments = [
  {
    name: 'General Outpatient',
    description: 'First point of contact for consultations, diagnosis and treatment.',
    location: 'Ground Floor, Block A',
  },
  {
    name: 'Laboratory',
    description: 'Diagnostic testing including haematology, chemistry and microbiology.',
    location: 'Ground Floor, Block B',
  },
  {
    name: 'Pharmacy',
    description: 'Dispensing of prescribed medications and pharmaceutical advice.',
    location: 'Ground Floor, Block A',
  },
  {
    name: 'Dental',
    description: 'Oral health assessment, cleaning and dental procedures.',
    location: 'First Floor, Block C',
  },
  {
    name: 'Antenatal',
    description: 'Maternal health and antenatal monitoring for expectant mothers.',
    location: 'First Floor, Block C',
  },
  {
    name: 'Emergency',
    description: 'Urgent and emergency medical response, available on call.',
    location: 'Ground Floor, Block A',
  },
  {
    name: 'Health Screening',
    description: 'Preventive screening and periodic wellness checks.',
    location: 'First Floor, Block B',
  },
] as const;
