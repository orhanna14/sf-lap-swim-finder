// Pool configuration with SF Recreation & Parks pools plus nearby pools
const pools = [
  {
    id: 'balboa',
    name: 'Balboa Pool',
    city: 'San Francisco',
    address: 'San Jose & Havelock, San Francisco, CA 94112',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26439',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Balboa-Pool-212',
  },
  {
    id: 'coffman',
    name: 'Coffman Pool',
    city: 'San Francisco',
    address: 'Visitacion & Hahn, San Francisco, CA 94134',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26440',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Coffman-Pool-213',
  },
  {
    id: 'garfield',
    name: 'Garfield Pool',
    city: 'San Francisco',
    address: '26th & Harrison, San Francisco, CA 94110',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26441',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Garfield-Pool-214',
  },
  {
    id: 'hamilton',
    name: 'Hamilton Pool',
    city: 'San Francisco',
    address: 'Geary & Steiner, San Francisco, CA 94115',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26442',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Hamilton-Pool-215',
  },
  {
    id: 'mlk',
    name: 'Martin Luther King Jr. Pool',
    city: 'San Francisco',
    address: 'Third Street & Carroll, San Francisco, CA 94124',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26444',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Martin-Luther-King-Jr-Pool-216',
  },
  {
    id: 'mission',
    name: 'Mission Pool',
    city: 'San Francisco',
    address: '19th & Linda, San Francisco, CA 94110',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/27505',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Mission-Community-Pool-217',
  },
  {
    id: 'north-beach',
    name: 'North Beach Pool',
    city: 'San Francisco',
    address: 'Lombard & Mason, San Francisco, CA 94133',
    scheduleUrl: null, // No schedule available, under renovation until Nov 18, 2025
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/North-Beach-Pool-218',
  },
  {
    id: 'rossi',
    name: 'Rossi Pool',
    city: 'San Francisco',
    address: 'Arguello & Anza, San Francisco, CA 94118',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/26455',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Rossi-Pool-219',
  },
  {
    id: 'sava',
    name: 'Sava Pool',
    city: 'San Francisco',
    address: '19th Avenue & Wawona, San Francisco, CA 94116',
    scheduleUrl: 'https://sfrecpark.org/DocumentCenter/View/27654',
    detailsUrl: 'https://sfrecpark.org/Facilities/Facility/Details/Sava-Pool-220',
  },
  {
    id: 'brisbane',
    name: 'Brisbane Aquatic Center',
    city: 'Brisbane',
    address: '50 Park Place, Brisbane, CA 94005',
    scheduleUrl: null, // User needs to provide PDF URL
    detailsUrl: 'https://www.brisbaneca.org/parksrec/page/community-pool',
  },
  {
    id: 'burlingame',
    name: 'Burlingame Recreation Center',
    city: 'Burlingame',
    address: '850 Burlingame Ave, Burlingame, CA 94010',
    scheduleUrl: null, // User needs to provide PDF URL
    detailsUrl: 'https://www.burlingameaquatics.com/programs/community/lap-swimming',
  },
];

module.exports = pools;