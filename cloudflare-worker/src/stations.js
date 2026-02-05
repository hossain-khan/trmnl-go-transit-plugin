/**
 * GO Transit Lines and Stations Configuration
 *
 * Static mapping of all GO Transit lines to their stations.
 * Used for xhrSelect dependent dropdown in plugin configuration.
 *
 * Format: { lineCode: { name: 'Display Name', stations: [{ 'Station Name': 'CODE' }, ...] } }
 */

export const LINES_AND_STATIONS = {
  LE: {
    name: 'Lakeshore East',
    stations: [
      { 'Union Station': 'UN' },
      { 'Exhibition GO': 'EX' },
      { 'Danforth GO': 'DA' },
      { 'Scarborough GO': 'SC' },
      { 'Eglinton GO': 'EG' },
      { 'Guildwood GO': 'GU' },
      { 'Rouge Hill GO': 'RO' },
      { 'Pickering GO': 'PIN' },
      { 'Ajax GO': 'AJ' },
      { 'Whitby GO': 'WH' },
      { 'Oshawa GO': 'OS' },
    ],
  },
  LW: {
    name: 'Lakeshore West',
    stations: [
      { 'Union Station': 'UN' },
      { 'Mimico GO': 'MI' },
      { 'Long Branch GO': 'LO' },
      { 'Port Credit GO': 'PO' },
      { 'Clarkson GO': 'CL' },
      { 'Oakville GO': 'OA' },
      { 'Bronte GO': 'BO' },
      { 'Appleby GO': 'AP' },
      { 'Burlington GO': 'BU' },
      { 'Aldershot GO': 'AL' },
      { 'Hamilton GO Centre': 'HA' },
      { 'West Harbour GO': 'WR' },
      { 'St. Catharines GO': 'SCTH' },
      { 'Niagara Falls GO': 'NI' },
    ],
  },
  MI: {
    name: 'Milton',
    stations: [
      { 'Union Station': 'UN' },
      { 'Kipling GO': 'KP' },
      { 'Dixie GO': 'DI' },
      { 'Cooksville GO': 'CO' },
      { 'Erindale GO': 'ER' },
      { 'Streetsville GO': 'SR' },
      { 'Meadowvale GO': 'ME' },
      { 'Lisgar GO': 'LS' },
      { 'Milton GO': 'ML' },
    ],
  },
  KI: {
    name: 'Kitchener',
    stations: [
      { 'Union Station': 'UN' },
      { 'Bloor GO': 'BL' },
      { 'Weston GO': 'WE' },
      { 'Etobicoke North GO': 'ET' },
      { 'Malton GO': 'MA' },
      { 'Bramalea GO': 'BE' },
      { 'Brampton GO': 'BR' },
      { 'Mount Pleasant GO': 'MO' },
      { 'Georgetown GO': 'GE' },
      { 'Acton GO': 'AC' },
      { 'Guelph Central GO': 'GL' },
      { 'Kitchener GO': 'KI' },
    ],
  },
  BR: {
    name: 'Barrie',
    stations: [
      { 'Union Station': 'UN' },
      { 'Downsview Park GO': 'DW' },
      { 'Rutherford GO': 'RU' },
      { 'Maple GO': 'MP' },
      { 'King City GO': 'KC' },
      { 'Aurora GO': 'AU' },
      { 'Newmarket GO': 'NE' },
      { 'East Gwillimbury GO': 'EA' },
      { 'Bradford GO': 'BD' },
      { 'Barrie South GO': 'BA' },
      { 'Allandale Waterfront GO': 'AD' },
    ],
  },
  RH: {
    name: 'Richmond Hill',
    stations: [
      { 'Union Station': 'UN' },
      { 'Oriole GO': 'OR' },
      { 'Old Cummer GO': 'OL' },
      { 'Langstaff GO': 'LA' },
      { 'Richmond Hill GO': 'RI' },
      { 'Gormley GO': 'GO' },
    ],
  },
  ST: {
    name: 'Stouffville',
    stations: [
      { 'Union Station': 'UN' },
      { 'Kennedy GO': 'KE' },
      { 'Agincourt GO': 'AG' },
      { 'Milliken GO': 'MK' },
      { 'Unionville GO': 'UI' },
      { 'Centennial GO': 'CE' },
      { 'Markham GO': 'MR' },
      { 'Mount Joy GO': 'MJ' },
      { 'Stouffville GO': 'ST' },
      { 'Old Elm GO': 'LI' },
    ],
  },
}
