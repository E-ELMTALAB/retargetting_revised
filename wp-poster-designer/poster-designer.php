<?php
/*
Plugin Name: WP Poster Designer
Description: Design poster templates in admin and allow users to customize and download.
Version: 1.0.0
Author: Codex AI
*/

if (!defined('ABSPATH')) exit;

class WP_Poster_Designer {
    public function __construct() {
        add_action('init', [$this, 'register_post_type']);
        add_action('add_meta_boxes', [$this, 'add_meta_boxes']);
        add_action('save_post_poster_template', [$this, 'save_design']);
        add_shortcode('poster_designer', [$this, 'render_shortcode']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_front_scripts']);
    }

    public function register_post_type() {
        register_post_type('poster_template', [
            'label' => 'Poster Templates',
            'public' => false,
            'show_ui' => true,
            'supports' => ['title'],
        ]);
    }

    public function add_meta_boxes() {
        add_meta_box('poster_design_box', 'Poster Design', [$this, 'render_design_box'], 'poster_template', 'normal', 'high');
    }

    public function enqueue_admin_scripts($hook) {
        if ($hook === 'post.php' || $hook === 'post-new.php') {
            wp_enqueue_script('fabric', 'https://unpkg.com/fabric@5.2.4/dist/fabric.min.js');
            wp_enqueue_script('poster-admin', plugins_url('poster-admin.js', __FILE__), ['fabric'], '1.0', true);
        }
    }

    public function enqueue_front_scripts() {
        wp_enqueue_script('fabric', 'https://unpkg.com/fabric@5.2.4/dist/fabric.min.js');
        wp_enqueue_script('poster-front', plugins_url('poster-front.js', __FILE__), ['fabric'], '1.0', true);
    }

    public function render_design_box($post) {
        $design = get_post_meta($post->ID, '_poster_design', true);
        echo '<div id="poster-designer-canvas-wrapper"><canvas id="poster-canvas" width="600" height="800"></canvas></div>';
        echo '<input type="hidden" id="poster-design" name="poster_design" value="' . esc_attr($design) . '" />';
        echo '<button type="button" class="button" id="save-poster-design">Save Design</button>';
    }

    public function save_design($post_id) {
        if (isset($_POST['poster_design'])) {
            update_post_meta($post_id, '_poster_design', wp_kses_post($_POST['poster_design']));
        }
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts(['id' => 0], $atts);
        $design = get_post_meta((int)$atts['id'], '_poster_design', true);
        ob_start();
        echo '<canvas id="poster-canvas-front" width="600" height="800"></canvas>';
        echo '<button id="download-poster">Download</button>';
        echo '<script>var POSTER_DATA = ' . json_encode($design ? $design : '') . ';</script>';
        return ob_get_clean();
    }
}

new WP_Poster_Designer();
?>
