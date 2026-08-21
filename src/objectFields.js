export const OBJECTS = ['Account', 'Opportunity', 'Lead', 'Contact', 'Case']

export const FIELDS = {
  Account: ['Id', 'Name', 'Phone', 'Website', 'Industry'],
  Opportunity: ['Id', 'Name', 'Amount', 'StageName', 'CloseDate'],
  Lead: ['Id', 'FirstName', 'LastName', 'Company', 'Email'],
  Contact: ['Id', 'FirstName', 'LastName', 'Email', 'Phone'],
  Case: ['Id', 'CaseNumber', 'Subject', 'Status', 'Priority'],
}

export function editableFields(objectName) {
  return FIELDS[objectName].filter((f) => f !== 'Id')
}
