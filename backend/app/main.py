from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
from datetime import datetime, date
from pydantic import BaseModel
import random
from geopy import distance

app = FastAPI(title="CarMax AutoCare Network API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Location(BaseModel):
    lat: float
    lng: float

class Shop(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    location: Location
    phone: str
    rating: float
    review_count: int
    is_maxcare_certified: bool
    services: List[str]
    hours: dict
    distance: Optional[float] = None
    
class PriceEstimate(BaseModel):
    shop_id: str
    service: str
    parts_cost: float
    labor_cost: float
    total_cost: float
    maxcare_discount: float
    customer_cost: float
    estimated_time_hours: float

class Appointment(BaseModel):
    shop_id: str
    service: str
    date: str
    time: str
    customer_name: str
    customer_phone: str
    customer_email: str
    vehicle_year: int
    vehicle_make: str
    vehicle_model: str
    has_maxcare: bool
    special_instructions: Optional[str] = ""

class AppointmentConfirmation(BaseModel):
    confirmation_number: str
    appointment: Appointment
    shop: Shop
    price_estimate: PriceEstimate

# Mock data generation
def generate_mock_shops():
    """Generate mock repair shops for demo"""
    shop_names = [
        "Precision Auto Care", "Expert Automotive", "Quick Fix Auto",
        "Premium Car Care", "Trusty Mechanics", "Auto Excellence",
        "City Auto Repair", "Express Auto Service", "Master Mechanics",
        "Quality Car Care", "Pro Auto Solutions", "Elite Auto Works"
    ]
    
    services = [
        "Oil Change", "Brake Service", "Tire Rotation", "Engine Diagnostic",
        "Transmission Service", "AC Repair", "Battery Replacement",
        "Suspension Repair", "Exhaust System", "Wheel Alignment"
    ]
    
    shops = []
    
    # Generate shops around major cities
    city_centers = [
        {"city": "Richmond", "state": "VA", "lat": 37.5407, "lng": -77.4360},
        {"city": "Atlanta", "state": "GA", "lat": 33.7490, "lng": -84.3880},
        {"city": "Dallas", "state": "TX", "lat": 32.7767, "lng": -96.7970},
        {"city": "Phoenix", "state": "AZ", "lat": 33.4484, "lng": -112.0740},
        {"city": "Los Angeles", "state": "CA", "lat": 34.0522, "lng": -118.2437}
    ]
    
    shop_id = 1
    for city_data in city_centers:
        for i in range(8):  # 8 shops per city
            # Generate location near city center (within ~20 miles)
            lat_offset = random.uniform(-0.3, 0.3)
            lng_offset = random.uniform(-0.3, 0.3)
            
            shop = Shop(
                id=f"shop_{shop_id}",
                name=f"{random.choice(shop_names)} - {city_data['city']}",
                address=f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Elm', 'Park', 'Washington'])} Street",
                city=city_data["city"],
                state=city_data["state"],
                zip_code=f"{random.randint(10000, 99999)}",
                location=Location(
                    lat=city_data["lat"] + lat_offset,
                    lng=city_data["lng"] + lng_offset
                ),
                phone=f"({random.randint(200, 999)}) {random.randint(200, 999)}-{random.randint(1000, 9999)}",
                rating=round(random.uniform(3.5, 5.0), 1),
                review_count=random.randint(50, 500),
                is_maxcare_certified=random.choice([True, True, True, False]),  # 75% certified
                services=random.sample(services, k=random.randint(6, 10)),
                hours={
                    "monday": "8:00 AM - 6:00 PM",
                    "tuesday": "8:00 AM - 6:00 PM",
                    "wednesday": "8:00 AM - 6:00 PM",
                    "thursday": "8:00 AM - 6:00 PM",
                    "friday": "8:00 AM - 6:00 PM",
                    "saturday": "9:00 AM - 4:00 PM",
                    "sunday": "Closed"
                }
            )
            shops.append(shop)
            shop_id += 1
    
    return shops

# Initialize mock data
SHOPS = generate_mock_shops()

# Pricing data
PRICING_DATA = {
    "Oil Change": {"parts": 35, "labor": 45, "hours": 0.5},
    "Brake Service": {"parts": 250, "labor": 200, "hours": 2.0},
    "Tire Rotation": {"parts": 0, "labor": 40, "hours": 0.5},
    "Engine Diagnostic": {"parts": 0, "labor": 120, "hours": 1.0},
    "Transmission Service": {"parts": 150, "labor": 180, "hours": 2.0},
    "AC Repair": {"parts": 200, "labor": 150, "hours": 1.5},
    "Battery Replacement": {"parts": 150, "labor": 50, "hours": 0.5},
    "Suspension Repair": {"parts": 400, "labor": 350, "hours": 3.5},
    "Exhaust System": {"parts": 300, "labor": 200, "hours": 2.0},
    "Wheel Alignment": {"parts": 0, "labor": 100, "hours": 1.0}
}

# MaxCare coverage percentages
MAXCARE_COVERAGE = {
    "Oil Change": 0.0,  # Maintenance not covered
    "Brake Service": 0.8,  # 80% covered
    "Tire Rotation": 0.0,  # Maintenance not covered
    "Engine Diagnostic": 1.0,  # Fully covered
    "Transmission Service": 0.9,  # 90% covered
    "AC Repair": 0.85,  # 85% covered
    "Battery Replacement": 0.0,  # Wear item not covered
    "Suspension Repair": 0.9,  # 90% covered
    "Exhaust System": 0.8,  # 80% covered
    "Wheel Alignment": 0.5  # 50% covered
}

@app.get("/")
async def root():
    return {
        "message": "CarMax AutoCare Network API",
        "version": "1.0.0",
        "endpoints": {
            "shops": "/api/shops/search",
            "pricing": "/api/pricing/estimate",
            "appointments": "/api/appointments/book",
            "services": "/api/services"
        }
    }

@app.get("/api/shops/search", response_model=List[Shop])
async def search_shops(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(25, description="Search radius in miles"),
    service: Optional[str] = Query(None, description="Filter by service"),
    maxcare_only: bool = Query(False, description="Only MaxCare certified shops"),
    min_rating: Optional[float] = Query(None, description="Minimum rating filter")
):
    """Search for repair shops near a location"""
    user_location = (lat, lng)
    filtered_shops = []
    
    for shop in SHOPS:
        shop_location = (shop.location.lat, shop.location.lng)
        shop_distance = distance.distance(user_location, shop_location).miles
        
        # Apply filters
        if shop_distance > radius:
            continue
            
        if maxcare_only and not shop.is_maxcare_certified:
            continue
            
        if service and service not in shop.services:
            continue
            
        if min_rating and shop.rating < min_rating:
            continue
        
        # Add distance to shop object
        shop_with_distance = shop.model_copy()
        shop_with_distance.distance = round(shop_distance, 1)
        filtered_shops.append(shop_with_distance)
    
    # Sort by distance
    filtered_shops.sort(key=lambda x: x.distance)
    
    return filtered_shops[:20]  # Return top 20 results

@app.get("/api/services")
async def get_services():
    """Get all available services"""
    return {
        "services": list(PRICING_DATA.keys()),
        "maxcare_coverage": MAXCARE_COVERAGE
    }

@app.post("/api/pricing/estimate", response_model=PriceEstimate)
async def get_price_estimate(
    shop_id: str,
    service: str,
    has_maxcare: bool = False
):
    """Get price estimate for a service at a specific shop"""
    
    # Find shop
    shop = next((s for s in SHOPS if s.id == shop_id), None)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get base pricing
    if service not in PRICING_DATA:
        raise HTTPException(status_code=400, detail="Service not available")
    
    base_price = PRICING_DATA[service]
    
    # Apply regional multiplier (demo - based on state)
    regional_multipliers = {
        "CA": 1.3, "TX": 0.9, "GA": 0.95, "AZ": 1.0, "VA": 1.05
    }
    multiplier = regional_multipliers.get(shop.state, 1.0)
    
    # Calculate costs
    parts_cost = base_price["parts"] * multiplier
    labor_cost = base_price["labor"] * multiplier
    total_cost = parts_cost + labor_cost
    
    # Apply MaxCare discount
    maxcare_discount = 0
    if has_maxcare and shop.is_maxcare_certified:
        coverage_rate = MAXCARE_COVERAGE.get(service, 0)
        maxcare_discount = total_cost * coverage_rate
    
    customer_cost = total_cost - maxcare_discount
    
    return PriceEstimate(
        shop_id=shop_id,
        service=service,
        parts_cost=round(parts_cost, 2),
        labor_cost=round(labor_cost, 2),
        total_cost=round(total_cost, 2),
        maxcare_discount=round(maxcare_discount, 2),
        customer_cost=round(customer_cost, 2),
        estimated_time_hours=base_price["hours"]
    )

@app.post("/api/appointments/book", response_model=AppointmentConfirmation)
async def book_appointment(appointment: Appointment):
    """Book a repair appointment"""
    
    # Validate shop exists
    shop = next((s for s in SHOPS if s.id == appointment.shop_id), None)
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get price estimate
    price_estimate = await get_price_estimate(
        shop_id=appointment.shop_id,
        service=appointment.service,
        has_maxcare=appointment.has_maxcare
    )
    
    # Generate confirmation number
    confirmation_number = f"CMX-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
    
    return AppointmentConfirmation(
        confirmation_number=confirmation_number,
        appointment=appointment,
        shop=shop,
        price_estimate=price_estimate
    )

@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get analytics data for admin dashboard"""
    
    # Mock analytics data
    total_shops = len(SHOPS)
    certified_shops = len([s for s in SHOPS if s.is_maxcare_certified])
    avg_rating = sum(s.rating for s in SHOPS) / len(SHOPS)
    
    # Mock appointment data
    mock_appointments = random.randint(8500, 12000)
    mock_revenue = mock_appointments * random.uniform(15, 25)  # Booking fees
    
    return {
        "network_stats": {
            "total_shops": total_shops,
            "certified_shops": certified_shops,
            "certification_rate": round(certified_shops / total_shops * 100, 1),
            "average_rating": round(avg_rating, 2),
            "states_covered": len(set(s.state for s in SHOPS))
        },
        "appointment_stats": {
            "total_this_month": mock_appointments,
            "growth_rate": round(random.uniform(5, 15), 1),
            "average_booking_value": round(random.uniform(250, 450), 2),
            "maxcare_usage_rate": round(random.uniform(65, 75), 1)
        },
        "financial_stats": {
            "booking_fees_mtd": round(mock_revenue, 2),
            "estimated_annual_savings": round(random.uniform(10, 15) * 1_000_000, 2),
            "referral_fees_saved": round(mock_appointments * random.uniform(25, 35), 2)
        },
        "top_services": [
            {"service": "Brake Service", "count": random.randint(1500, 2500)},
            {"service": "Oil Change", "count": random.randint(2000, 3000)},
            {"service": "Engine Diagnostic", "count": random.randint(1000, 1500)},
            {"service": "AC Repair", "count": random.randint(800, 1200)},
            {"service": "Transmission Service", "count": random.randint(600, 900)}
        ],
        "shop_performance": [
            {
                "shop_name": shop.name,
                "appointments": random.randint(50, 300),
                "rating": shop.rating,
                "satisfaction_score": round(random.uniform(85, 98), 1)
            }
            for shop in random.sample(SHOPS, 10)
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)