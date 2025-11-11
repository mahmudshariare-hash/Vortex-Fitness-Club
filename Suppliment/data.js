export const ALL_PRODUCTS = [
  { id:1, name:"Whey Protein Isolate", brand:"ProFit", price:49.99, originalPrice:59.99, rating:4.8, reviews:1247,
    image:"https://images.pexels.com/photos/4162481/pexels-photo-4162481.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"protein", isBestseller:true, stock:23 },
  { id:2, name:"Pre-Workout Extreme", brand:"EnergyMax", price:39.99, rating:4.6, reviews:856,
    image:"https://images.pexels.com/photos/4162438/pexels-photo-4162438.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"pre-workout", isNew:true, stock:18 },
  { id:3, name:"Creatine Monohydrate", brand:"MuscleTech", price:24.99, originalPrice:29.99, rating:4.9, reviews:2134,
    image:"https://images.pexels.com/photos/4162516/pexels-photo-4162516.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"muscle-building", isBestseller:true, stock:7 },
  { id:4, name:"BCAA Recovery", brand:"RecoverPlus", price:34.99, rating:4.7, reviews:632,
    image:"https://images.pexels.com/photos/4162453/pexels-photo-4162453.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"recovery", stock:15 },
  { id:5, name:"Fat Burner Pro", brand:"LeanMax", price:44.99, originalPrice:54.99, rating:4.5, reviews:423,
    image:"https://images.pexels.com/photos/4162448/pexels-photo-4162448.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"weight-loss", isNew:true, stock:31 },
  { id:6, name:"Multivitamin Elite", brand:"HealthCore", price:29.99, rating:4.4, reviews:789,
    image:"https://images.pexels.com/photos/4162465/pexels-photo-4162465.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"vitamins", stock:42 },
  { id:7, name:"Casein Protein", brand:"ProFit", price:54.99, rating:4.6, reviews:567,
    image:"https://images.pexels.com/photos/4162497/pexels-photo-4162497.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"protein", stock:19 },
  { id:8, name:"Testosterone Booster", brand:"AlphaMax", price:69.99, originalPrice:79.99, rating:4.3, reviews:234,
    image:"https://images.pexels.com/photos/4162512/pexels-photo-4162512.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop",
    category:"hormone-support", stock:12 },
];

export const QUIZ_QUESTIONS = [
  { id:"goal", label:"What is your primary fitness goal?", options:[
    ["muscle-gain","Build Muscle Mass","Increase muscle size and strength"],
    ["weight-loss","Lose Weight","Burn fat and get lean"],
    ["endurance","Improve Endurance","Enhance stamina and cardio"],
    ["general-health","General Health","Overall wellness and vitality"],
  ]},
  { id:"experience", label:"What is your fitness experience level?", options:[
    ["beginner","Beginner","Just starting my fitness journey"],
    ["intermediate","Intermediate","6 months to 2 years of training"],
    ["advanced","Advanced","2+ years of consistent training"],
    ["athlete","Professional Athlete","Competitive level training"],
  ]},
  { id:"workout-frequency", label:"How often do you work out?", options:[
    ["1-2","1-2 times per week","Light activity"],
    ["3-4","3-4 times per week","Moderate activity"],
    ["5-6","5-6 times per week","High activity"],
    ["daily","Daily","Very high activity"],
  ]},
  { id:"intensity", label:"What is your preferred workout intensity?", options:[
    ["low","Low Intensity","Light cardio, yoga, walking"],
    ["moderate","Moderate Intensity","Steady cardio, light weights"],
    ["high","High Intensity","Heavy lifting, HIIT, sprints"],
    ["extreme","Extreme Intensity","Maximum effort training"],
  ]},
];

export const QUIZ_RECO = {
  "muscle-gain": { title:"Muscle Building Stack", desc:"Perfect for gaining lean muscle mass and strength", products:["Whey Protein Isolate","Creatine Monohydrate","BCAA Recovery"], color:"from-blue-400 to-blue-600" },
  "weight-loss": { title:"Fat Burning Stack", desc:"Optimized for fat loss and lean physique", products:["Fat Burner Pro","L-Carnitine","Whey Protein"], color:"from-red-400 to-red-600" },
  "endurance":   { title:"Endurance Stack", desc:"Enhanced stamina and cardiovascular performance", products:["Pre-Workout Extreme","Electrolyte Blend","Beta-Alanine"], color:"from-green-400 to-green-600" },
  "general-health": { title:"Wellness Stack", desc:"Complete nutrition for overall health", products:["Multivitamin Elite","Omega-3 Complex","Probiotics"], color:"from-purple-400 to-purple-600" },
};
