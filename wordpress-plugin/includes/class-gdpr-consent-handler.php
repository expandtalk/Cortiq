<?php
/**
 * WordPress AJAX handler för GDPR consent lagring
 */

// Hook for logged in users
add_action('wp_ajax_store_gdpr_consent', 'heatmap_store_gdpr_consent');
// Hook for non-logged in users  
add_action('wp_ajax_nopriv_store_gdpr_consent', 'heatmap_store_gdpr_consent');

function heatmap_store_gdpr_consent() {
    // Verify nonce for security
    if (!wp_verify_nonce($_POST['nonce'], 'gdpr_consent_nonce')) {
        wp_die('Security check failed');
    }
    
    $tracking_id = sanitize_text_field($_POST['tracking_id']);
    $consent_data = sanitize_text_field($_POST['consent_data']);
    $user_agent = sanitize_text_field($_POST['user_agent']);
    $session_id = sanitize_text_field($_POST['session_id']);
    
    // Get Supabase settings
    $supabase_url = get_option('heatmap_supabase_url');
    $supabase_key = get_option('heatmap_supabase_anon_key');
    
    if (empty($supabase_url) || empty($supabase_key)) {
        wp_send_json_error('Supabase not configured');
        return;
    }
    
    // Get client IP
    $client_ip = '';
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $client_ip = $_SERVER['HTTP_X_REAL_IP'];
    } else {
        $client_ip = $_SERVER['REMOTE_ADDR'];
    }
    
    // Prepare data for Supabase
    $payload = array(
        'site_id' => $tracking_id,
        'session_id' => $session_id,
        'consent_types' => json_decode($consent_data, true)['choices'],
        'ip_address' => $client_ip,
        'user_agent' => $user_agent,
        'geo_country' => null, // Will be resolved server-side
        'source' => 'wordpress_plugin'
    );
    
    // Send to Supabase Edge Function
    $response = wp_remote_post($supabase_url . '/functions/v1/store-consent', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $supabase_key
        ),
        'body' => json_encode($payload),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        error_log('GDPR Consent storage failed: ' . $response->get_error_message());
        wp_send_json_error('Failed to store consent');
    } else {
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['success']) && $data['success']) {
            wp_send_json_success('Consent stored successfully');
        } else {
            error_log('GDPR Consent storage failed: ' . $body);
            wp_send_json_error('Failed to store consent');
        }
    }
}
?>