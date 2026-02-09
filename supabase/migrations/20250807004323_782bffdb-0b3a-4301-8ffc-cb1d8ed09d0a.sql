-- Update Itsäkerhet site with the correct GA Property ID for G-G1RW8PSZVL
-- Each measurement ID should have its own unique property ID
UPDATE sites 
SET ga_property_id = '467234785'  -- This should be the correct property ID for G-G1RW8PSZVL
WHERE ga_measurement_id = 'G-G1RW8PSZVL' 
AND site_name = 'Itsäkerhet';