export const soilHealthData = {
  ph: 6.5,
  nitrogen: 45,
  phosphorus: 30,
  potassium: 55,
  moisture: 35,
  temperature: 24,
};

export const cropRecommendations = [
  {
    id: 1,
    name: 'Rice',
    suitability: 95,
    season: 'Monsoon',
    reason: 'Optimal pH and high moisture content make this ideal for rice cultivation',
    image: '🌾',
  },
  {
    id: 2,
    name: 'Wheat',
    suitability: 88,
    season: 'Winter',
    reason: 'Good NPK balance and moderate moisture are perfect for wheat',
    image: '🌾',
  },
  {
    id: 3,
    name: 'Tomato',
    suitability: 82,
    season: 'Summer',
    reason: 'Soil pH and nutrient levels support excellent tomato growth',
    image: '🍅',
  },
  {
    id: 4,
    name: 'Cotton',
    suitability: 75,
    season: 'Summer',
    reason: 'Adequate drainage and nutrient content suitable for cotton',
    image: '🌿',
  },
];

export const forumPosts = [
  {
    id: 1,
    author: 'Rajesh Kumar',
    role: 'Farmer',
    question: 'What is the best time to plant tomatoes in Karnataka?',
    replies: 3,
    timestamp: '2 hours ago',
    answers: [
      {
        id: 1,
        author: 'Dr. Priya Sharma',
        role: 'Lab Expert',
        answer: 'The best time to plant tomatoes in Karnataka is during late monsoon (September-October) or early winter (November-December). This ensures optimal temperature and moisture.',
        timestamp: '1 hour ago',
      },
    ],
  },
  {
    id: 2,
    author: 'Manjunath Reddy',
    role: 'Farmer',
    question: 'How can I improve soil nitrogen naturally?',
    replies: 5,
    timestamp: '5 hours ago',
    answers: [],
  },
  {
    id: 3,
    author: 'Lakshmi Devi',
    role: 'Farmer',
    question: 'My rice crop is showing yellowing leaves. What could be the problem?',
    replies: 2,
    timestamp: '1 day ago',
    answers: [],
  },
];

export const calendarTasks = [
  {
    id: 1,
    title: 'Water rice field',
    type: 'watering',
    date: '2025-11-01',
    completed: false,
  },
  {
    id: 2,
    title: 'Apply organic fertilizer',
    type: 'fertilizing',
    date: '2025-11-03',
    completed: false,
  },
  {
    id: 3,
    title: 'Prune tomato plants',
    type: 'pruning',
    date: '2025-11-05',
    completed: false,
  },
  {
    id: 4,
    title: 'Harvest wheat crop',
    type: 'harvesting',
    date: '2025-11-10',
    completed: false,
  },
];

export const sustainabilityTips = [
  {
    id: 1,
    title: 'Drip Irrigation',
    description: 'Save up to 60% water by using drip irrigation systems',
    icon: '💧',
    category: 'water',
  },
  {
    id: 2,
    title: 'Composting',
    description: 'Use kitchen waste to create nutrient-rich compost for your soil',
    icon: '♻️',
    category: 'organic',
  },
  {
    id: 3,
    title: 'Crop Rotation',
    description: 'Rotate crops annually to improve soil health and reduce pests',
    icon: '🔄',
    category: 'soil',
  },
  {
    id: 4,
    title: 'Mulching',
    description: 'Apply organic mulch to retain moisture and suppress weeds',
    icon: '🌿',
    category: 'soil',
  },
];

export const mapLocations = [
  {
    id: 1,
    name: 'Field A',
    lat: 12.9716,
    lng: 77.5946,
    status: 'healthy',
    soilHealth: 85,
  },
  {
    id: 2,
    name: 'Field B',
    lat: 12.9820,
    lng: 77.6100,
    status: 'moderate',
    soilHealth: 65,
  },
  {
    id: 3,
    name: 'Field C',
    lat: 12.9600,
    lng: 77.5800,
    status: 'critical',
    soilHealth: 40,
  },
];

export const chartData = {
  nutrients: [
    { month: 'Jan', nitrogen: 40, phosphorus: 25, potassium: 50 },
    { month: 'Feb', nitrogen: 42, phosphorus: 27, potassium: 52 },
    { month: 'Mar', nitrogen: 45, phosphorus: 30, potassium: 55 },
    { month: 'Apr', nitrogen: 43, phosphorus: 28, potassium: 53 },
    { month: 'May', nitrogen: 46, phosphorus: 32, potassium: 56 },
    { month: 'Jun', nitrogen: 45, phosphorus: 30, potassium: 55 },
  ],
  soilHealth: [
    { name: 'pH', value: 85 },
    { name: 'Moisture', value: 70 },
    { name: 'Temperature', value: 80 },
    { name: 'Organic Matter', value: 65 },
  ],
};
