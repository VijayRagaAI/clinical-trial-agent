#!/usr/bin/env python3
"""
Test script to demonstrate AI-powered study conversion from ClinicalTrials.gov format to our format
"""

import asyncio
import json
import os
from main import convert_external_study_to_local

# Sample external study data from ClinicalTrials.gov
sample_external_study = {
    "nct_id": "NCT05123456",
    "title": "A Phase II Study of Novel Diabetes Drug XY-123 in Type 2 Diabetes",
    "official_title": "A Randomized, Double-Blind, Placebo-Controlled Phase II Study to Evaluate the Efficacy and Safety of XY-123 in Adults with Type 2 Diabetes Mellitus",
    "status": "Recruiting",
    "phase": "Phase 2",
    "conditions": ["Type 2 Diabetes Mellitus", "Diabetes Mellitus"],
    "brief_summary": "This study will test whether XY-123, a new oral medication, can help control blood sugar levels in adults with type 2 diabetes. Participants will take either XY-123 or a placebo (sugar pill) once daily for 6 months while continuing their regular diabetes care.",
    "detailed_description": "Type 2 diabetes mellitus is a chronic condition affecting millions worldwide. Current treatments often have limitations in efficacy and side effects. XY-123 is a novel glucose-lowering agent that works through a unique mechanism targeting insulin sensitivity. This 6-month randomized controlled trial will evaluate the efficacy and safety of XY-123 compared to placebo in 200 adults with inadequately controlled type 2 diabetes.",
    "study_type": "Interventional",
    "enrollment": 200,
    "start_date": "2024-01-15",
    "primary_completion_date": "2024-12-31",
    "last_update": "2024-06-15",
    "study_first_posted": "2024-01-10",
    "min_age": "18 Years",
    "max_age": "75 Years", 
    "gender": "All",
    "healthy_volunteers": "No",
    "eligibility_criteria": """
Inclusion Criteria:
- Age 18-75 years
- Diagnosis of type 2 diabetes mellitus for at least 6 months
- HbA1c between 7.0% and 10.5% at screening
- Body mass index (BMI) between 25 and 40 kg/m²
- Stable diabetes medications for at least 3 months
- Ability to understand and follow study procedures
- Available for all study visits over 6 months

Exclusion Criteria:
- Type 1 diabetes or secondary diabetes
- Severe diabetic complications (retinopathy, nephropathy, neuropathy)
- History of diabetic ketoacidosis in past 6 months
- Recent heart attack or stroke (within 6 months)
- Severe kidney disease (eGFR < 30 mL/min/1.73m²)
- Liver disease or abnormal liver function tests
- Pregnancy or breastfeeding
- Participation in another clinical trial within 30 days
- Unable to comply with study requirements
"""
}

async def main():
    """Test the AI conversion"""
    print("🧪 Testing AI-Powered Study Conversion")
    print("=" * 50)
    
    # Check if OPENAI_API_KEY is set
    if not os.getenv('OPENAI_API_KEY'):
        print("❌ OPENAI_API_KEY environment variable not set!")
        print("Please set your OpenAI API key:")
        print("export OPENAI_API_KEY='your-api-key-here'")
        return
    
    print("📥 Input (ClinicalTrials.gov format):")
    print(json.dumps(sample_external_study, indent=2))
    print("\n" + "=" * 50)
    
    try:
        print("🤖 Converting with GPT-4o-mini...")
        converted_study = await convert_external_study_to_local(sample_external_study)
        
        print("✅ Conversion successful!")
        print("\n📤 Output (Our format):")
        print(json.dumps(converted_study, indent=2))
        
        print("\n" + "=" * 50)
        print("🎯 Key Improvements from AI:")
        print(f"- Extracted {len(converted_study.get('criteria', []))} eligibility criteria")
        print(f"- Category: {converted_study['trial']['category']}")
        print(f"- Generated {len(converted_study['overview']['key_procedures'])} key procedures")
        print("- Converted medical terms to patient-friendly questions")
        print("- Assigned priorities based on importance")
        
    except Exception as e:
        print(f"❌ Conversion failed: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 