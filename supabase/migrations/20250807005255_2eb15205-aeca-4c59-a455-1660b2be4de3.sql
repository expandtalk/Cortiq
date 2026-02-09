-- Update Itsäkerhet site with the correct GA Property ID and Measurement ID
-- Property ID: 4613480324, Measurement ID: G-TMVK2VZC99
UPDATE sites 
SET ga_property_id = '4613480324',
    ga_measurement_id = 'G-TMVK2VZC99'
WHERE site_name ILIKE '%itsäkerhet%' OR domain ILIKE '%itsäkerhet%';