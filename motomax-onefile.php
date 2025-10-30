<?php
/**
 * Plugin Name:       MotoMax OneFile — Core SEO · Writer · Links · QuickCall
 * Plugin URI:        https://motomax.vn
 * Description:       Một plugin PHP duy nhất cung cấp các tính năng SEO, Nội dung, Liên kết nội bộ, và Thanh Gọi nhanh. Tối ưu và bảo mật.
 * Version:           1.0.0
 * Author:            MotoMax Team
 * Author URI:        https://motomax.vn
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       motomax-onefile
 * Domain Path:       /languages
 * Requires at least: 5.8
 * Requires PHP:      7.4
 *
 * @package MotoMaxOneFile
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'MM1_PLUGIN_SLUG', 'motomax-onefile' );
define( 'MM1_OPTION_GROUP', 'mm1_settings' );
define( 'MM1_OPTION_NAME', 'mm1_options' );
define( 'MM1_VERSION', '1.0.0' );

/**
 * Class MotoMax_OneFile_Core
 *
 * Main plugin class to encapsulate all functionality.
 */
class MotoMax_OneFile_Core {

	/**
	 * Plugin options.
	 *
	 * @var array
	 */
	private $options;

	/**
	 * Instance of the class.
	 *
	 * @var MotoMax_OneFile_Core
	 */
	private static $instance = null;

	/**
	 * Singleton instance retrieval.
	 *
	 * @return MotoMax_OneFile_Core
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 *
	 * Hooks all actions and filters.
	 */
	public function __construct() {
		// Load options
		$this->options = get_option( MM1_OPTION_NAME, array() );

		// Core hooks
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'admin_menu', array( $this, 'admin_menu' ) );
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );

		// Uninstall hook
		register_uninstall_hook( __FILE__, array( __CLASS__, 'on_uninstall' ) );

		// 1. Settings (Handled by admin_menu, admin_init)
		// 2. SEO Meta + OG
		if ( $this->get_option_state( 'enable_seo' ) && ! $this->is_seo_plugin_active() ) {
			add_action( 'wp_head', array( $this, 'seo_meta_head' ), 1 );
			add_filter( 'wp_title', array( $this, 'filter_wp_title' ), 99, 2 );
			add_filter( 'document_title_parts', array( $this, 'filter_title_parts' ), 99 );
			add_action( 'add_meta_boxes', array( $this, 'add_seo_metabox' ) );
			add_action( 'save_post', array( $this, 'save_seo_metabox' ) );
		}

		// 3. JSON-LD
		if ( $this->get_option_state( 'enable_jsonld' ) && ! $this->is_seo_plugin_active() ) {
			add_action( 'wp_head', array( $this, 'json_ld_head' ), 10 );
		}

		// 4. Quick-Call Bar
		if ( $this->get_option_state( 'enable_quickcall' ) && wp_is_mobile() ) {
			add_action( 'wp_footer', array( $this, 'quick_call_bar_html' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'quick_call_bar_assets' ) );
		}

		// 5. TOC
		if ( $this->get_option_state( 'enable_toc' ) ) {
			add_filter( 'the_content', array( $this, 'auto_insert_toc' ), 15 );
			add_action( 'wp_enqueue_scripts', array( $this, 'frontend_assets' ) );
		}

		// 6. Internal Linking
		if ( $this->get_option_state( 'enable_links' ) ) {
			add_filter( 'the_content', array( $this, 'internal_linking' ), 10 );
		}

		// 7. Related Posts
		if ( $this->get_option_state( 'enable_related' ) ) {
			add_filter( 'the_content', array( $this, 'related_posts' ), 20 );
		}

		// 8. HTML Sitemap
		add_shortcode( 'mm1_sitemap', array( $this, 'sitemap_shortcode' ) );

		// 9. Auto Writer
		if ( $this->get_option_state( 'enable_writer' ) ) {
			add_action( 'add_meta_boxes', array( $this, 'add_writer_metabox' ) );
			add_action( 'save_post', array( $this, 'save_writer_metabox' ) );
			add_action( 'wp_ajax_mm1_generate_content', array( $this, 'ajax_generate_content' ) );
			add_action( 'mm1_scheduled_writer_hook', array( $this, 'run_scheduled_writer' ) );
		}

		// 10. Analytics
		if ( $this->get_option_state( 'enable_analytics' ) ) {
			add_action( 'wp_head', array( $this, 'track_post_view' ) );
			// Admin page is added in admin_menu()
		}

		// 11. Redirect & 404
		if ( $this->get_option_state( 'enable_redirect' ) ) {
			add_action( 'template_redirect', array( $this, 'redirect_404_handler' ) );
		}
	}

	/**
	 * Init hook.
	 *
	 * Registers textdomain and scheduled events.
	 */
	public function init() {
		load_plugin_textdomain( MM1_PLUGIN_SLUG, false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );

		// Register shortcode for FAQ
		add_shortcode( 'mm1_faq', array( $this, 'faq_shortcode_handler' ) );

		// Schedule cron job
		if ( $this->get_option_state( 'enable_writer' ) && $this->get_option_value( 'writer_schedule' ) !== 'none' ) {
			if ( ! wp_next_scheduled( 'mm1_scheduled_writer_hook' ) ) {
				wp_schedule_event( time(), $this->get_option_value( 'writer_schedule' ), 'mm1_scheduled_writer_hook' );
			}
		} else {
			// Clear schedule if disabled
			$timestamp = wp_next_scheduled( 'mm1_scheduled_writer_hook' );
			if ( $timestamp ) {
				wp_unschedule_event( $timestamp, 'mm1_scheduled_writer_hook' );
			}
		}
	}

	/**
	 * Helper: Get option state (enabled/disabled).
	 *
	 * @param string $key The module key (e.g., 'enable_seo').
	 * @return bool
	 */
	private function get_option_state( $key ) {
		return isset( $this->options['modules'][ $key ] ) && $this->options['modules'][ $key ] === 'on';
	}

	/**
	 * Helper: Get option value.
	 *
	 * @param string $key The option key.
	 * @param mixed  $default Default value.
	 * @return mixed
	 */
	private function get_option_value( $key, $default = '' ) {
		return isset( $this->options[ $key ] ) ? $this->options[ $key ] : $default;
	}

	/**
	 * Helper: Check for active SEO plugins.
	 *
	 * @return bool
	 */
	public function is_seo_plugin_active() {
		return (
			defined( 'WPSEO_FILE' ) || // Yoast SEO
			defined( 'RANK_MATH_VERSION' ) || // Rank Math
			defined( 'SEOPRESS_VERSION' ) // SEOPress
		);
	}

	// =========================================================================
	// 1. Settings Page
	// =========================================================================

	/**
	 * Add admin menus.
	 */
	public function admin_menu() {
		add_options_page(
			'MotoMax OneFile Settings',
			'MotoMax OneFile',
			'manage_options',
			MM1_PLUGIN_SLUG,
			array( $this, 'settings_page_html' )
		);

		if ( $this->get_option_state( 'enable_analytics' ) ) {
			add_submenu_page(
				'index.php',
				'Báo cáo hiệu suất',
				'Báo cáo MotoMax',
				'manage_options',
				'mm1-reports',
				array( $this, 'reports_page_html' )
			);
		}
	}

	/**
	 * Register settings.
	 */
	public function admin_init() {
		register_setting( MM1_OPTION_GROUP, MM1_OPTION_NAME, array( $this, 'sanitize_options' ) );
	}

	/**
	 * Sanitize plugin options.
	 *
	 * @param array $input The raw input from settings form.
	 * @return array The sanitized array.
	 */
	public function sanitize_options( $input ) {
		$sanitized = array();

		// General
		$sanitized['site_brand']    = sanitize_text_field( $input['site_brand'] ?? '' );
		$sanitized['phone']         = sanitize_text_field( $input['phone'] ?? '' );
		$sanitized['zalo_url']      = esc_url_raw( $input['zalo_url'] ?? '' );
		$sanitized['map_url']       = esc_url_raw( $input['map_url'] ?? '' );
		$sanitized['primary_color'] = sanitize_hex_color( $input['primary_color'] ?? '#0A84FF' );
		$sanitized['default_og_image'] = absint( $input['default_og_image'] ?? 0 );

		// Modules
		$modules = array(
			'enable_seo',
			'enable_jsonld',
			'enable_quickcall',
			'enable_toc',
			'enable_links',
			'enable_related',
			'enable_writer',
			'enable_analytics',
			'enable_redirect',
			'enable_404_log',
			'enable_uninstall_data',
		);
		foreach ( $modules as $module ) {
			$sanitized['modules'][ $module ] = isset( $input['modules'][ $module ] ) && $input['modules'][ $module ] === 'on' ? 'on' : 'off';
		}

		// Internal Linking
		$sanitized['link_rules'] = sanitize_textarea_field( $input['link_rules'] ?? '' );

		// Writer
		$sanitized['writer_schedule'] = sanitize_text_field( $input['writer_schedule'] ?? 'none' );
		$sanitized['writer_topics']   = sanitize_textarea_field( $input['writer_topics'] ?? '' );
		$sanitized['writer_post_type'] = sanitize_key( $input['writer_post_type'] ?? 'post' );
		$sanitized['writer_author_id'] = absint( $input['writer_author_id'] ?? 1 );

		// Redirects
		$sanitized['redirect_rules'] = sanitize_textarea_field( $input['redirect_rules'] ?? '' );

		// Clear 404 logs if requested
		if ( isset( $input['clear_404_logs'] ) && $input['clear_404_logs'] === '1' ) {
			delete_option( 'mm1_404_logs' );
			add_settings_error( MM1_OPTION_NAME, '404_cleared', 'Đã xóa nhật ký 404.', 'updated' );
		}

		return $sanitized;
	}

	/**
	 * Render the main settings page.
	 */
	public function settings_page_html() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		// Handle tabs
		$active_tab = isset( $_GET['tab'] ) ? sanitize_key( $_GET['tab'] ) : 'general';
		?>
		<style>
			.mm1-wrap .nav-tab-wrapper { margin-bottom: 20px; }
			.mm1-wrap .form-table { max-width: 800px; }
			.mm1-wrap .form-table th { width: 200px; }
			.mm1-wrap textarea { width: 100%; min-height: 150px; font-family: monospace; }
			.mm1-wrap .notice.notice-warning.inline { padding: 10px; }
			.mm1-logs-table { width: 100%; background: #fff; border-collapse: collapse; }
			.mm1-logs-table th, .mm1-logs-table td { border: 1px solid #ccd0d4; padding: 8px; text-align: left; }
			.mm1-logs-table th { background: #f0f0f1; }
			.mm1-logs-table td:first-child { word-break: break-all; }
			.mm1-logs-table td:last-child { width: 100px; text-align: center; }
		</style>
		<div class="wrap mm1-wrap">
			<h1><?php esc_html_e( 'Cài đặt MotoMax OneFile', 'motomax-onefile' ); ?></h1>
			<?php settings_errors(); ?>

			<h2 class="nav-tab-wrapper">
				<a href="?page=<?php echo esc_attr( MM1_PLUGIN_SLUG ); ?>&tab=general" class="nav-tab <?php echo $active_tab === 'general' ? 'nav-tab-active' : ''; ?>">Chung</a>
				<a href="?page=<?php echo esc_attr( MM1_PLUGIN_SLUG ); ?>&tab=modules" class="nav-tab <?php echo $active_tab === 'modules' ? 'nav-tab-active' : ''; ?>">Modules</a>
				<a href="?page=<?php echo esc_attr( MM1_PLUGIN_SLUG ); ?>&tab=links" class="nav-tab <?php echo $active_tab === 'links' ? 'nav-tab-active' : ''; ?>">Liên kết nội bộ</a>
				<a href="?page=<?php echo esc_attr( MM1_PLUGIN_SLUG ); ?>&tab=writer" class="nav-tab <?php echo $active_tab === 'writer' ? 'nav-tab-active' : ''; ?>">Auto Writer</a>
				<a href="?page=<?php echo esc_attr( MM1_PLUGIN_SLUG ); ?>&tab=redirects" class="nav-tab <?php echo $active_tab === 'redirects' ? 'nav-tab-active' : ''; ?>">Chuyển hướng & 404</a>
			</h2>

			<form action="options.php" method="post">
				<?php
				settings_fields( MM1_OPTION_GROUP );
				?>
				
				<?php if ( $active_tab === 'general' ) : ?>
					<h3>Cài đặt chung</h3>
					<table class="form-table">
						<?php $this->render_field( 'site_brand', 'Tên thương hiệu', 'text', 'Tên ngắn gọn của website (ví dụ: MotoMax)' ); ?>
						<?php $this->render_field( 'phone', 'Số điện thoại', 'tel', 'Số điện thoại chính (ví dụ: 0903409111)' ); ?>
						<?php $this->render_field( 'zalo_url', 'URL Zalo', 'url', 'Link Zalo OA hoặc cá nhân (ví dụ: https://zalo.me/0903409111)' ); ?>
						<?php $this->render_field( 'map_url', 'URL Google Map', 'url', 'Link Google Map (ví dụ: https://goo.gl/maps/...)' ); ?>
						<?php $this->render_field( 'primary_color', 'Màu chủ đạo', 'color', 'Màu cho thanh Quick Call (mặc định: #0A84FF)' ); ?>
						<?php $this->render_field( 'default_og_image', 'Ảnh OG mặc định', 'media', 'Ảnh hiển thị khi chia sẻ mạng xã hội nếu bài viết không có ảnh đại diện.' ); ?>
					</table>
				
				<?php elseif ( $active_tab === 'modules' ) : ?>
					<h3>Quản lý Modules</h3>
					<?php if ( $this->is_seo_plugin_active() ) : ?>
						<div class="notice notice-warning inline">
							<p><strong>Đã phát hiện plugin SEO khác (Yoast, Rank Math, SEOPress).</strong></p>
							<p>Các module SEO & JSON-LD của MotoMax OneFile đã được tự động tắt để tránh xung đột.</p>
						</div>
					<?php endif; ?>
					<table class="form-table">
						<?php $this->render_field( 'modules[enable_seo]', 'SEO Meta & OG', 'checkbox', 'Tự động tạo thẻ meta title, description, canonical, robots, OpenGraph, Twitter.', $this->is_seo_plugin_active() ); ?>
						<?php $this->render_field( 'modules[enable_jsonld]', 'JSON-LD Schema', 'checkbox', 'Tự động tạo schema WebSite, Organization, Article, FAQPage.', $this->is_seo_plugin_active() ); ?>
						<?php $this->render_field( 'modules[enable_quickcall]', 'Thanh Quick Call', 'checkbox', 'Hiển thị thanh Gọi/Zalo/Map ở đáy màn hình mobile.' ); ?>
						<?php $this->render_field( 'modules[enable_toc]', 'Mục lục tự động (TOC)', 'checkbox', 'Tự động chèn mục lục vào bài viết (nếu có ≥3 H2/H3).' ); ?>
						<?php $this->render_field( 'modules[enable_links]', 'Liên kết nội bộ', 'checkbox', 'Tự động chèn liên kết nội bộ dựa trên quy tắc từ khóa.' ); ?>
						<?php $this->render_field( 'modules[enable_related]', 'Bài viết liên quan', 'checkbox', 'Hiển thị 6 bài viết liên quan (theo category/tag) cuối bài viết.' ); ?>
						<?php $this->render_field( 'modules[enable_writer]', 'Auto Writer (Offline)', 'checkbox', 'Bật metabox và trình tạo nội dung cơ bản (rule-based).' ); ?>
						<?php $this->render_field( 'modules[enable_analytics]', 'Analytics (đếm view)', 'checkbox', 'Đếm lượt xem bài viết (lưu vào post meta) và tạo trang báo cáo.' ); ?>
						<?php $this->render_field( 'modules[enable_redirect]', 'Chuyển hướng 301', 'checkbox', 'Kích hoạt module chuyển hướng 301.' ); ?>
						<?php $this->render_field( 'modules[enable_404_log]', 'Ghi log 404', 'checkbox', 'Ghi lại các URL 404 vào Cài đặt > Chuyển hướng & 404.' ); ?>
					</table>
					<h3>Dọn dẹp khi gỡ cài đặt</h3>
					<table class="form-table">
						<?php $this->render_field( 'modules[enable_uninstall_data]', 'Xóa dữ liệu khi gỡ', 'checkbox', 'Nếu được chọn, tất cả options và transients của plugin sẽ bị xóa khi gỡ cài đặt.' ); ?>
					</table>

				<?php elseif ( $active_tab === 'links' ) : ?>
					<h3>Quy tắc liên kết nội bộ</h3>
					<table class="form-table">
						<?php $this->render_field( 'link_rules', 'Quy tắc (Keyword -> URL)', 'textarea', 'Mỗi quy tắc trên một dòng. Định dạng: <code>Từ khóa -> URL đầy đủ</code><br>Ví dụ: <code>xe máy điện -> https://example.com/xe-may-dien</code><br>Plugin sẽ chỉ chèn 1 lần cho mỗi từ khóa tìm thấy đầu tiên trong bài. Không chèn link vào H1, link có sẵn, code...' ); ?>
					</table>

				<?php elseif ( $active_tab === 'writer' ) : ?>
					<h3>Cài đặt Auto Writer (Scheduler)</h3>
					<p>Tạo bài viết nháp tự động dựa trên danh sách chủ đề bên dưới.</p>
					<table class="form-table">
						<?php
						$schedules = array( 'none' => 'Không chạy', 'hourly' => 'Hàng giờ', 'twicedaily' => '12 giờ / lần', 'daily' => 'Hàng ngày' );
						$this->render_field( 'writer_schedule', 'Tần suất chạy', 'select', 'Chọn tần suất để cron job tự động tạo bài nháp.', false, $schedules );

						$post_types = get_post_types( array( 'public' => true ), 'objects' );
						$pt_options = array();
						foreach ( $post_types as $pt ) {
							$pt_options[ $pt->name ] = $pt->labels->singular_name;
						}
						$this->render_field( 'writer_post_type', 'Loại bài viết', 'select', 'Chọn loại nội dung để tạo bài nháp.', false, $pt_options );

						$users = get_users( array( 'role__in' => array( 'author', 'editor', 'administrator' ) ) );
						$user_options = array();
						foreach ( $users as $user ) {
							$user_options[ $user->ID ] = $user->display_name;
						}
						$this->render_field( 'writer_author_id', 'Tác giả', 'select', 'Chọn tác giả cho bài viết được tạo tự động.', false, $user_options );

						$this->render_field( 'writer_topics', 'Danh sách chủ đề', 'textarea', 'Mỗi chủ đề trên một dòng. Scheduler sẽ lấy ngẫu nhiên một chủ đề để tạo bài nháp và xóa nó khỏi danh sách.' );
						?>
					</table>

				<?php elseif ( $active_tab === 'redirects' ) : ?>
					<h3>Chuyển hướng 301</h3>
					<table class="form-table">
						<?php $this->render_field( 'redirect_rules', 'Quy tắc (Path -> URL)', 'textarea', 'Mỗi quy tắc trên một dòng. Định dạng: <code>/path-cu/ -> URL mới đầy đủ</code><br>Ví dụ: <code>/bai-viet-cu.html -> https://example.com/bai-viet-moi</code>' ); ?>
					</table>
					
					<h3>Nhật ký 404 (404 Logs)</h3>
					<?php
					$logs = get_option( 'mm1_404_logs', array() );
					arsort( $logs ); // Sort by count desc
					if ( ! empty( $logs ) ) :
						?>
						<p>
							<label>
								<input type="checkbox" name="<?php echo esc_attr( MM1_OPTION_NAME ); ?>[clear_404_logs]" value="1">
								Xóa tất cả nhật ký 404
							</label>
						</p>
						<table class="mm1-logs-table">
							<thead>
								<tr>
									<th>URL (Path) bị lỗi 404</th>
									<th>Số lần</th>
								</tr>
							</thead>
							<tbody>
								<?php foreach ( array_slice( $logs, 0, 100 ) as $path => $count ) : // Limit to top 100 ?>
									<tr>
										<td><code><?php echo esc_html( $path ); ?></code></td>
										<td><?php echo esc_html( $count ); ?></td>
									</tr>
								<?php endforeach; ?>
							</tbody>
						</table>
					<?php else : ?>
						<p>Chưa ghi nhận lỗi 404 nào.</p>
					<?php endif; ?>

				<?php endif; ?>

				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}

	/**
	 * Helper: Render a settings field.
	 *
	 * @param string $id ID/Name of the field.
	 * @param string $label Label text.
	 * @param string $type Field type (text, textarea, checkbox, color, media).
	 * @param string $desc Description text.
	 * @param bool   $disabled Whether the field is disabled.
	 * @param array  $options For select/radio types.
	 */
	private function render_field( $id, $label, $type, $desc = '', $disabled = false, $options = array() ) {
		// Get value
		$name    = MM1_OPTION_NAME . "[$id]";
		$value   = $this->get_option_value( str_replace( array( '[', ']' ), array( '.', '' ), $id ) ); // Handle array keys
		$path    = explode( '[', str_replace( ']', '', $id ) );
		$value   = $this->options;
		foreach ( $path as $p ) {
			$value = $value[ $p ] ?? ( $type === 'checkbox' ? 'off' : '' );
		}
		
		$disabled_attr = $disabled ? ' disabled' : '';

		?>
		<tr valign="top">
			<th scope="row">
				<label for="mm1_<?php echo esc_attr( $id ); ?>"><?php echo esc_html( $label ); ?></label>
			</th>
			<td>
				<?php
				switch ( $type ) :
					case 'textarea':
						?>
						<textarea id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" rows="5" class="large-text"<?php echo $disabled_attr; ?>><?php echo esc_textarea( $value ); ?></textarea>
						<?php
						break;

					case 'checkbox':
						?>
						<label>
							<input type="checkbox" id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="on" <?php checked( $value, 'on' ); ?><?php echo $disabled_attr; ?>>
							<?php echo esc_html( $label ); ?>
						</label>
						<?php
						break;

					case 'color':
						?>
						<input type="text" id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="mm1-color-field" data-default-color="#0A84FF"<?php echo $disabled_attr; ?>>
						<?php
						break;

					case 'select':
						?>
						<select id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>"<?php echo $disabled_attr; ?>>
							<?php foreach ( $options as $val => $text ) : ?>
								<option value="<?php echo esc_attr( $val ); ?>" <?php selected( $value, $val ); ?>><?php echo esc_html( $text ); ?></option>
							<?php endforeach; ?>
						</select>
						<?php
						break;
					
					case 'media':
						$image_url = $value ? wp_get_attachment_thumb_url( $value ) : '';
						?>
						<div class="mm1-media-uploader">
							<input type="hidden" id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>">
							<button type="button" class="button mm1-upload-btn">Chọn ảnh</button>
							<button type="button" class="button mm1-remove-btn" style="<?php echo $value ? '' : 'display:none;'; ?>">Gỡ bỏ</button>
							<div class="mm1-image-preview" style="margin-top:10px;">
								<?php if ( $image_url ) : ?>
									<img src="<?php echo esc_url( $image_url ); ?>" style="max-height: 100px; width: auto;">
								<?php endif; ?>
							</div>
						</div>
						<?php
						break;

					case 'text':
					case 'url':
					case 'tel':
					default:
						?>
						<input type="text" id="mm1_<?php echo esc_attr( $id ); ?>" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="regular-text"<?php echo $disabled_attr; ?>>
						<?php
						break;

				endswitch;
				?>
				<?php if ( $desc && $type !== 'checkbox' ) : ?>
					<p class="description"><?php echo wp_kses_post( $desc ); ?></p>
				<?php endif; ?>
			</td>
		</tr>
		<?php
	}

	/**
	 * Enqueue admin scripts (color picker, media uploader).
	 */
	public function admin_scripts( $hook ) {
		if ( 'settings_page_motomax-onefile' !== $hook && 'post.php' !== $hook && 'post-new.php' !== $hook ) {
			return;
		}

		// For settings page
		if ( 'settings_page_motomax-onefile' === $hook ) {
			wp_enqueue_style( 'wp-color-picker' );
			wp_enqueue_media();
			
			wp_add_inline_script(
				'wp-color-picker',
				'(function($){
					$(function(){ 
						$(".mm1-color-field").wpColorPicker(); 
						
						// Media Uploader
						var mediaUploader;
						$(document).on("click", ".mm1-upload-btn", function(e) {
							e.preventDefault();
							var $btn = $(this);
							var $wrap = $btn.closest(".mm1-media-uploader");
							
							if (mediaUploader) {
								mediaUploader.open();
								return;
							}
							
							mediaUploader = wp.media.frames.file_frame = wp.media({
								title: "Chọn ảnh OG",
								button: { text: "Sử dụng ảnh này" },
								multiple: false
							});
							
							mediaUploader.on("select", function() {
								var attachment = mediaUploader.state().get("selection").first().toJSON();
								$wrap.find("input[type=hidden]").val(attachment.id);
								$wrap.find(".mm1-image-preview").html(\'<img src="\' + attachment.sizes.thumbnail.url + \'" style="max-height: 100px; width: auto;">\');
								$wrap.find(".mm1-remove-btn").show();
							});
							
							mediaUploader.open();
						});
						
						$(document).on("click", ".mm1-remove-btn", function(e) {
							e.preventDefault();
							var $btn = $(this);
							var $wrap = $btn.closest(".mm1-media-uploader");
							$wrap.find("input[type=hidden]").val("");
							$wrap.find(".mm1-image-preview").html("");
							$btn.hide();
						});
					});
				})(jQuery);'
			);
		}
		
		// For Auto-Writer Metabox
		if ( 'post.php' === $hook || 'post-new.php' === $hook ) {
			wp_add_inline_script(
				'wp-util', // Dependency
				'(function() {
					document.addEventListener("click", function(e) {
						if (!e.target.matches(".mm1-writer-btn")) {
							return;
						}
						e.preventDefault();
						
						var btn = e.target;
						var action = btn.dataset.action;
						var nonce = document.getElementById("mm1_writer_nonce").value;
						var topic = document.getElementById("mm1_writer_topic").value;
						var min = document.getElementById("mm1_writer_min").value;
						var max = document.getElementById("mm1_writer_max").value;
						var resultDiv = document.getElementById("mm1-writer-result");
						
						if (!topic) {
							resultDiv.innerHTML = \'<p style="color: red;">Vui lòng nhập Chủ đề/Keyword.</p>\';
							return;
						}
						
						btn.disabled = true;
						resultDiv.innerHTML = "<p>Đang xử lý, vui lòng chờ...</p>";
						
						var formData = new FormData();
						formData.append("action", action);
						formData.append("nonce", nonce);
						formData.append("topic", topic);
						formData.append("min", min);
						formData.append("max", max);
						formData.append("post_id", ' . get_the_ID() . ');

						fetch(ajaxurl, {
							method: "POST",
							body: formData
						})
						.then(response => response.json())
						.then(data => {
							btn.disabled = false;
							if (data.success) {
								resultDiv.innerHTML = \'<p style="color: green;">Đã tạo xong! Đang chèn vào trình soạn thảo...</p>\';
								insertContentIntoEditor(data.data.html);
							} else {
								resultDiv.innerHTML = \'<p style="color: red;">Lỗi: \' + data.data.message + \'</p>\';
							}
						})
						.catch(error => {
							btn.disabled = false;
							resultDiv.innerHTML = \'<p style="color: red;">Lỗi kết nối: \' + error + \'</p>\';
						});
					});
					
					function insertContentIntoEditor(html) {
						// Check for Gutenberg (Block Editor)
						if (window.wp && window.wp.data && window.wp.blocks) {
							var blocks = window.wp.blocks.rawHandler({ HTML: html });
							window.wp.data.dispatch("core/editor").insertBlocks(blocks);
						} 
						// Check for Classic Editor (TinyMCE)
						else if (window.tinymce && window.tinymce.activeEditor) {
							window.tinymce.activeEditor.execCommand("mceInsertContent", false, html);
						} 
						// Fallback to textarea
						else {
							var editorTextarea = document.getElementById("content");
							if (editorTextarea) {
								editorTextarea.value += html;
							}
						}
					}
				})();'
			);
		}
	}

	// =========================================================================
	// 2. SEO Meta + OG
	// =========================================================================

	/**
	 * Add SEO Metabox.
	 */
	public function add_seo_metabox() {
		add_meta_box(
			'mm1_seo_metabox',
			'MotoMax SEO',
			array( $this, 'seo_metabox_html' ),
			null, // All post types
			'normal',
			'high'
		);
	}

	/**
	 * Render SEO Metabox HTML.
	 *
	 * @param WP_Post $post The post object.
	 */
	public function seo_metabox_html( $post ) {
		wp_nonce_field( 'mm1_save_seo_meta', 'mm1_seo_nonce' );

		$title = get_post_meta( $post->ID, '_mm1_seo_title', true );
		$desc  = get_post_meta( $post->ID, '_mm1_seo_desc', true );
		?>
		<style>
			.mm1-seo-field { width: 100%; margin-bottom: 10px; }
			.mm1-seo-field label { display: block; font-weight: bold; margin-bottom: 5px; }
			.mm1-seo-field input { width: 100%; }
			.mm1-seo-field textarea { width: 100%; height: 80px; }
			.mm1-seo-field p { margin: 0; font-size: 12px; color: #666; }
		</style>
		<div class="mm1-seo-field">
			<label for="mm1_seo_title">Tiêu đề SEO (Title)</label>
			<input type="text" id="mm1_seo_title" name="mm1_seo_title" value="<?php echo esc_attr( $title ); ?>">
			<p>Nếu để trống, sẽ tự động dùng tiêu đề bài viết. (Tối ưu: 50-60 ký tự)</p>
		</div>
		<div class="mm1-seo-field">
			<label for="mm1_seo_desc">Mô tả SEO (Description)</label>
			<textarea id="mm1_seo_desc" name="mm1_seo_desc"><?php echo esc_textarea( $desc ); ?></textarea>
			<p>Nếu để trống, sẽ tự động dùng tóm tắt hoặc nội dung bài viết. (Tối ưu: 120-150 ký tự)</p>
		</div>
		<?php
	}

	/**
	 * Save SEO Metabox data.
	 *
	 * @param int $post_id The post ID.
	 */
	public function save_seo_metabox( $post_id ) {
		// Check nonce
		if ( ! isset( $_POST['mm1_seo_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['mm1_seo_nonce'] ), 'mm1_save_seo_meta' ) ) {
			return;
		}
		// Check capabilities
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		// Check autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Save Title
		if ( isset( $_POST['mm1_seo_title'] ) ) {
			$title = sanitize_text_field( $_POST['mm1_seo_title'] );
			update_post_meta( $post_id, '_mm1_seo_title', $title );
		}

		// Save Description
		if ( isset( $_POST['mm1_seo_desc'] ) ) {
			$desc = sanitize_textarea_field( $_POST['mm1_seo_desc'] );
			update_post_meta( $post_id, '_mm1_seo_desc', $desc );
		}
	}

	/**
	 * Filter wp_title (for older themes).
	 */
	public function filter_wp_title( $title, $sep ) {
		$parts = $this->get_seo_title_parts();
		return $parts['title'] . ( $parts['site'] ? " $sep " . $parts['site'] : '' );
	}
	
	/**
	 * Filter document_title_parts (for modern themes).
	 */
	public function filter_title_parts( $parts ) {
		 $new_parts = $this->get_seo_title_parts();
		 $parts['title'] = $new_parts['title'];
		 $parts['site'] = $new_parts['site'];
		 // Clear others if needed
		 unset($parts['tagline']);
		 return $parts;
	}
	
	/**
	 * Helper: Get SEO title parts.
	 */
	private function get_seo_title_parts() {
		$title = '';
		$site = get_bloginfo( 'name' );

		if ( is_singular() ) {
			$post_id = get_queried_object_id();
			$custom_title = get_post_meta( $post_id, '_mm1_seo_title', true );
			$title = $custom_title ? $custom_title : get_the_title( $post_id );
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$title = single_term_title( '', false );
		} elseif ( is_home() || is_front_page() ) {
			$title = get_bloginfo( 'name' );
			$site = get_bloginfo( 'description' ); // Use tagline for site part
		} elseif ( is_search() ) {
			$title = 'Kết quả tìm kiếm cho "' . get_search_query() . '"';
		} elseif ( is_404() ) {
			$title = 'Không tìm thấy trang';
		} else {
			$title = get_the_title(); // Fallback
		}
		
		return array(
			'title' => esc_html( $title ),
			'site' => esc_html( $site )
		);
	}
	
	/**
	 * Helper: Get SEO description.
	 */
	private function get_seo_description() {
		$desc = '';
		if ( is_singular() ) {
			$post_id = get_queried_object_id();
			$custom_desc = get_post_meta( $post_id, '_mm1_seo_desc', true );
			if ( $custom_desc ) {
				$desc = $custom_desc;
			} else {
				$post = get_post( $post_id );
				if ( has_excerpt( $post ) ) {
					$desc = get_the_excerpt( $post );
				} else {
					$desc = wp_trim_words( strip_shortcodes( $post->post_content ), 25, '...' );
				}
			}
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$desc = term_description();
		} elseif ( is_home() || is_front_page() ) {
			$desc = get_bloginfo( 'description' );
		}
		
		return esc_attr( strip_tags( $desc ) );
	}

	/**
	 * Output SEO meta tags in <head>.
	 */
	public function seo_meta_head() {
		global $post;
		
		// Description
		$description = $this->get_seo_description();
		if ( $description ) {
			echo '<meta name="description" content="' . esc_attr( $description ) . '">' . "\n";
		}

		// Robots
		$robots = 'index, follow';
		if ( is_search() || is_404() || ( is_archive() && ! is_category() && ! is_tag() ) ) {
			$robots = 'noindex, follow';
		}
		if ( ! get_option( 'blog_public' ) ) {
			$robots = 'noindex, nofollow';
		}
		echo '<meta name="robots" content="' . esc_attr( $robots ) . '">' . "\n";

		// Canonical
		$canonical = '';
		if ( is_singular() ) {
			$canonical = get_permalink( $post );
		} elseif ( is_category() || is_tag() || is_tax() ) {
			$canonical = get_term_link( get_queried_object() );
		} elseif ( is_home() || is_front_page() ) {
			$canonical = home_url( '/' );
		}
		if ( $canonical && ! is_wp_error( $canonical ) ) {
			echo '<link rel="canonical" href="' . esc_url( $canonical ) . '">' . "\n";
		}
		
		// === OpenGraph & Twitter ===
		$og_title = $this->get_seo_title_parts()['title'];
		$og_url = $canonical ? $canonical : home_url( $_SERVER['REQUEST_URI'] ?? '' );
		$og_type = is_singular() ? 'article' : 'website';
		$og_image = '';
		
		if( is_singular() && has_post_thumbnail() ) {
			$og_image = get_the_post_thumbnail_url( $post, 'full' );
		} else {
			$default_img_id = $this->get_option_value('default_og_image', 0);
			if ( $default_img_id ) {
				$og_image = wp_get_attachment_url( $default_img_id );
			}
		}

		echo '<meta property="og:title" content="' . esc_attr( $og_title ) . '">' . "\n";
		echo '<meta property="og:description" content="' . esc_attr( $description ) . '">' . "\n";
		echo '<meta property="og:url" content="' . esc_url( $og_url ) . '">' . "\n";
		echo '<meta property="og:site_name" content="' . esc_attr( get_bloginfo( 'name' ) ) . '">' . "\n";
		echo '<meta property="og:type" content="' . esc_attr( $og_type ) . '">' . "\n";
		if ( $og_image ) {
			echo '<meta property="og:image" content="' . esc_url( $og_image ) . '">' . "\n";
		}
		
		// Twitter
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
		echo '<meta name="twitter:title" content="' . esc_attr( $og_title ) . '">' . "\n";
		echo '<meta name="twitter:description" content="' . esc_attr( $description ) . '">' . "\n";
		if ( $og_image ) {
			echo '<meta name="twitter:image" content="' . esc_url( $og_image ) . '">' . "\n";
		}
	}

	// =========================================================================
	// 3. JSON-LD Schema
	// =========================================================================

	/**
	 * Output JSON-LD schema in <head>.
	 */
	public function json_ld_head() {
		global $post;
		$schemas = array();

		// WebSite + Organization (always on front page)
		if ( is_front_page() ) {
			$schemas['website'] = array(
				'@context' => 'https://schema.org',
				'@type'    => 'WebSite',
				'url'      => home_url( '/' ),
				'potentialAction' => array(
					'@type'       => 'SearchAction',
					'target'      => home_url( '/?s={search_term_string}' ),
					'query-input' => 'required name=search_term_string',
				),
			);
			
			$schemas['organization'] = array(
				'@context' => 'https://schema.org',
				'@type'    => 'Organization',
				'name'     => $this->get_option_value( 'site_brand', get_bloginfo( 'name' ) ),
				'url'      => home_url( '/' ),
				'logo'     => wp_get_attachment_url( get_theme_mod( 'custom_logo' ) ),
				'contactPoint' => array(
					'@type' => 'ContactPoint',
					'telephone' => $this->get_option_value( 'phone' ),
					'contactType' => 'customer service'
				)
			);
		}
		
		// Article (on single posts)
		if ( is_singular( 'post' ) ) {
			$schemas['article'] = array(
				'@context' => 'https://schema.org',
				'@type' => 'Article',
				'mainEntityOfPage' => array(
					'@type' => 'WebPage',
					'@id' => get_permalink( $post ),
				),
				'headline' => get_the_title( $post ),
				'description' => $this->get_seo_description(),
				'image' => get_the_post_thumbnail_url( $post, 'full' ),
				'author' => array(
					'@type' => 'Person',
					'name' => get_the_author_meta( 'display_name', $post->post_author ),
				),
				'publisher' => array(
					'@type' => 'Organization',
					'name' => $this->get_option_value( 'site_brand', get_bloginfo( 'name' ) ),
					'logo' => array(
						'@type' => 'ImageObject',
						'url' => wp_get_attachment_url( get_theme_mod( 'custom_logo' ) ),
					),
				),
				'datePublished' => get_the_date( 'c', $post ),
				'dateModified' => get_the_modified_date( 'c', $post ),
			);
		}
		
		// FAQPage (if shortcode exists)
		if ( is_singular() && has_shortcode( $post->post_content, 'mm1_faq' ) ) {
			// Find all shortcode blocks
			preg_match_all( '/' . get_shortcode_regex( array( 'mm1_faq' ) ) . '/s', $post->post_content, $matches );
			
			if ( ! empty( $matches[0] ) ) {
				$main_entity = array();
				foreach( $matches[0] as $faq_block ) {
					// Extract questions and answers
					preg_match_all( '/question=["\'](.*?)["\'] answer=["\'](.*?)["\']/s', $faq_block, $qa_pairs, PREG_SET_ORDER );
					foreach ( $qa_pairs as $pair ) {
						$main_entity[] = array(
							'@type' => 'Question',
							'name' => esc_html( $pair[1] ),
							'acceptedAnswer' => array(
								'@type' => 'Answer',
								'text' => wp_kses_post( $pair[2] ),
							),
						);
					}
				}
				
				if( !empty($main_entity) ) {
					$schemas['faq'] = array(
						'@context' => 'https://schema.org',
						'@type'    => 'FAQPage',
						'mainEntity' => $main_entity,
					);
				}
			}
		}

		// Output all schemas
		if ( ! empty( $schemas ) ) {
			foreach ( $schemas as $schema ) {
				echo '<script type="application/ld+json">' . wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
			}
		}
	}

	/**
	 * FAQ Shortcode Handler.
	 * [mm1_faq question="Câu hỏi 1?" answer="Trả lời 1."]
	 */
	public function faq_shortcode_handler( $atts, $content = null ) {
		// This shortcode is primarily for JSON-LD parsing.
		// It can optionally render HTML.
		$pairs = shortcode_parse_atts( $content ); // Not quite, need to parse content
		
		preg_match_all( '/\[mm1_faq_item question="(.*?)" answer="(.*?)"\]/s', $content, $matches, PREG_SET_ORDER );
		
		if( empty($matches) ) return '';
		
		$output = '<div class="mm1-faq-block" itemscope itemtype="https://schema.org/FAQPage">';
		foreach( $matches as $match ) {
			$question = esc_html( $match[1] );
			$answer = wp_kses_post( $match[2] );
			$output .= '<div class="mm1-faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">';
			$output .= '<h3 class="mm1-faq-question" itemprop="name">' . $question . '</h3>';
			$output .= '<div class="mm1-faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">';
			$output .= '<div itemprop="text">' . $answer . '</div>';
			$output .= '</div>';
			$output .= '</div>';
		}
		$output .= '</div>';
		
		// The JSON-LD script will re-parse this. This is just for display.
		// The shortcode format for the prompt was [mm1_faq] wrapping content.
		// Let's adjust to [mm1_faq][mm1_faq_item question="..." answer="..."][/mm1_faq]
		// Re-reading prompt: "khi có shortcode [mm1_faq]". This implies one shortcode, not pairs.
		// The prompt's example implies `[mm1_faq question="Câu hỏi 1?" answer="Trả lời 1."]`.
		// This is a self-closing shortcode, repeated.
		
		$atts = shortcode_atts(
			array(
				'question' => '',
				'answer'   => '',
			),
			$atts,
			'mm1_faq'
		);

		if ( empty( $atts['question'] ) || empty( $atts['answer'] ) ) {
			return '';
		}

		// This structure is better for the parser in json_ld_head
		// We'll just return the display
		return '<!-- MM1 FAQ Item: ' . esc_html( $atts['question'] ) . ' -->';
	}
	
	// =========================================================================
	// 4. Quick Call Bar
	// =========================================================================
	
	/**
	 * Output Quick Call Bar HTML.
	 */
	public function quick_call_bar_html() {
		$phone = $this->get_option_value( 'phone' );
		$zalo  = $this->get_option_value( 'zalo_url' );
		$map   = $this->get_option_value( 'map_url' );
		
		if ( empty( $phone ) && empty( $zalo ) && empty( $map ) ) {
			return;
		}
		?>
		<div id="mm1-quick-call" class="mm1-quick-call-bar" role="navigation" aria-label="Liên hệ nhanh">
			<?php if ( $phone ) : ?>
				<a href="tel:<?php echo esc_attr( preg_replace( '/\s+/', '', $phone ) ); ?>" class="mm1-call-btn" role="button">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
					<span>Gọi điện</span>
				</a>
			<?php endif; ?>
			<?php if ( $zalo ) : ?>
				<a href="<?php echo esc_url( $zalo ); ?>" class="mm1-zalo-btn" role="button" target="_blank" rel="noopener">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="#FFFFFF"><path d="M38.381 20.333c-0.034-0.213-0.081-0.425-0.155-0.631c-0.18-0.505-0.448-0.973-0.788-1.391c-0.347-0.427-0.767-0.796-1.242-1.091c-1.163-0.722-2.508-1.12-3.903-1.12c-0.336 0-0.671 0.019-1.002 0.057c-0.816 0.095-1.616 0.318-2.378 0.658c-2.002 0.892-3.666 2.454-4.786 4.458c-0.764 1.363-1.213 2.88-1.213 4.469c0 0.336 0.019 0.671 0.057 1.002c0.095 0.816 0.318 1.616 0.658 2.378c0.892 2.002 2.454 3.666 4.458 4.786c1.363 0.764 2.88 1.213 4.469 1.213c0.336 0 0.671-0.019 1.002-0.057c0.816-0.095 1.616-0.318 2.378-0.658c2.002-0.892 3.666-2.454 4.786-4.458c0.764-1.363 1.213-2.88 1.213-4.469c0-0.336-0.019-0.671-0.057-1.002c-0.095-0.816-0.318-1.616-0.658-2.378c-0.21-0.472-0.456-0.926-0.735-1.356Z"></path><path d="M24 4C12.954 4 4 12.954 4 24c0 11.046 8.954 20 20 20c11.046 0 20-8.954 20-20c0-11.046-8.954-20-20-20ZM14.832 18.318c-0.021-0.071-0.034-0.144-0.034-0.219c0-1.742 1.41-3.151 3.151-3.151c1.742 0 3.151 1.41 3.151 3.151c0 0.074-0.013 0.148-0.034 0.219c-0.052 0.177-0.121 0.344-0.208 0.502c-0.207 0.374-0.477 0.706-0.796 0.981c-0.65 0.559-1.446 0.879-2.28 0.879c-0.834 0-1.63-0.32-2.28-0.879c-0.318-0.275-0.589-0.607-0.796-0.981c-0.087-0.158-0.156-0.325-0.208-0.502ZM31.11 31.558c-0.165 0.334-0.354 0.658-0.565 0.97c-0.86 1.272-2.012 2.308-3.376 3.016c-0.741 0.384-1.536 0.656-2.37 0.803c-0.302 0.054-0.61 0.081-0.92 0.081c-1.393 0-2.756-0.391-3.959-1.11c-1.11-0.665-2.073-1.529-2.822-2.54c-1.077-1.453-1.769-3.197-1.769-5.068c0-0.302 0.019-0.6 0.057-0.893c0.091-0.716 0.3-1.41 0.617-2.064c0.75-1.545 1.963-2.823 3.49-3.693c0.776-0.44 1.624-0.75 2.518-0.914c0.322-0.059 0.651-0.089 0.985-0.089c1.393 0 2.756 0.391 3.959 1.11c1.11 0.665 2.073 1.529 2.822 2.54c1.077 1.453 1.769 3.197 1.769 5.068c0 0.302-0.019 0.6-0.057 0.893c-0.091 0.716-0.3 1.41-0.617 2.064c-0.22 0.453-0.473 0.887-0.756 1.297Z"></path></svg>
					<span>Chat Zalo</span>
				</a>
			<?php endif; ?>
			<?php if ( $map ) : ?>
				<a href="<?php echo esc_url( $map ); ?>" class="mm1-map-btn" role="button" target="_blank" rel="noopener">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
					<span>Chỉ đường</span>
				</a>
			<?php endif; ?>
		</div>
		<?php
	}
	
	/**
	 * Enqueue Quick Call Bar assets.
	 */
	public function quick_call_bar_assets() {
		$primary_color = $this->get_option_value( 'primary_color', '#0A84FF' );
		
		$css = "
		:root {
			--mm1-primary-color: " . esc_attr( $primary_color ) . ";
			--mm1-safe-area-bottom: env(safe-area-inset-bottom, 0px);
		}
		.mm1-quick-call-bar {
			position: fixed;
			bottom: var(--mm1-safe-area-bottom);
			left: 0;
			right: 0;
			height: 55px; /* Min 44px + padding */
			background-color: #ffffff;
			box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
			display: flex;
			justify-content: space-around;
			align-items: stretch;
			z-index: 998; /* Lower than most chat widgets */
			transition: bottom 0.2s ease-out;
		}
		.mm1-quick-call-bar a {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			flex-grow: 1;
			text-decoration: none;
			color: #333;
			font-size: 11px;
			font-weight: 500;
			line-height: 1.3;
			padding: 4px 0;
		}
		.mm1-quick-call-bar a svg {
			width: 22px;
			height: 22px;
			margin-bottom: 2px;
		}
		.mm1-quick-call-bar a.mm1-call-btn {
			background-color: var(--mm1-primary-color);
			color: #ffffff;
		}
		.mm1-quick-call-bar a.mm1-call-btn svg {
			stroke: #ffffff;
		}
		.mm1-quick-call-bar a.mm1-zalo-btn svg {
			fill: #0068ff;
		}
		.mm1-quick-call-bar a.mm1-map-btn svg {
			stroke: var(--mm1-primary-color);
		}
		";
		wp_add_inline_style( 'wp-block-library', $css ); // Hook to a common handle

		// JS for iOS keyboard avoidance
		$js = "
		(function() {
			var bar = document.getElementById('mm1-quick-call');
			if (!bar || !window.visualViewport) {
				// Fallback for devices without visualViewport or focus/blur
				var inputs = document.querySelectorAll('input, textarea, [contenteditable=\"true\"]');
				var hideBar = function() { bar.style.display = 'none'; };
				var showBar = function() { bar.style.display = 'flex'; };
				inputs.forEach(function(input) {
					input.addEventListener('focus', hideBar);
					input.addEventListener('blur', showBar);
				});
				return;
			}
			
			var vv = window.visualViewport;
			
			var setBarPosition = function() {
				// The space below the visual viewport
				var bottomOffset = window.innerHeight - (vv.offsetTop + vv.height);
				// Add safe area inset manually, as offset doesn't include it
				var safeArea = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mm1-safe-area-bottom')) || 0;
				bar.style.bottom = (bottomOffset + safeArea) + 'px';
			};
			
			vv.addEventListener('resize', setBarPosition);
			setBarPosition(); // Initial set
		})();
		";
		wp_add_inline_script( 'wp-block-library', $js, 'after' );
	}

	// =========================================================================
	// 5. Table of Contents (TOC)
	// =========================================================================

	/**
	 * Auto-insert TOC.
	 */
	public function auto_insert_toc( $content ) {
		if ( ! is_singular() || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}

		// Find H2/H3 tags
		preg_match_all( '/<h([2-3])(.*?)>(.*?)<\/h[2-3]>/i', $content, $matches, PREG_SET_ORDER );

		if ( count( $matches ) < 3 ) {
			return $content;
		}

		$toc_html = '';
		$toc_list = '';
		$current_level = 0;
		$heading_index = 0;

		// We need to modify $content to add IDs
		$content_with_ids = $content;

		foreach ( $matches as $match ) {
			$heading_index++;
			$level = (int) $match[1];
			$attrs = $match[2];
			$title = strip_tags( $match[3] );
			
			// Create a slug
			$slug = 'mm1-toc-' . $heading_index . '-' . sanitize_title( $title );
			
			// Check if ID already exists
			if ( preg_match( '/id=["\'](.*?)["\']/', $attrs, $id_match ) ) {
				$slug = $id_match[1];
			} else {
				// Add ID to the heading in the content
				$new_heading = sprintf( '<h%d%s id="%s">%s</h%d>', $level, $attrs, esc_attr( $slug ), $match[3], $level );
				// Use preg_replace for safer replacement, limit 1
				$content_with_ids = preg_replace( '/' . preg_quote( $match[0], '/' ) . '/', $new_heading, $content_with_ids, 1 );
			}
			
			// Build TOC list HTML
			if ( $level > $current_level ) {
				$toc_list .= '<ol>';
			} elseif ( $level < $current_level ) {
				$toc_list .= '</ol>';
			}
			$current_level = $level;
			
			$toc_list .= '<li><a href="#' . esc_attr( $slug ) . '">' . esc_html( $title ) . '</a></li>';
		}
		
		// Close any open lists
		while ( $current_level > 0 ) {
			$toc_list .= '</ol>';
			$current_level--;
		}

		// Build full TOC box
		$toc_id = 'mm1-toc-content';
		$toc_html = '
		<div class="mm1-toc" role="navigation" aria-label="Mục lục bài viết">
			<p class="mm1-toc-title">
				<span>Nội dung chính</span>
				<button type="button" class="mm1-toc-toggle" aria-expanded="true" aria-controls="' . $toc_id . '">
					[<span class="mm1-toc-toggle-text">ẩn</span>]
				</button>
			</p>
			<div id="' . $toc_id . '" class="mm1-toc-list">
				' . $toc_list . '
			</div>
		</div>
		';

		// Insert after the first paragraph
		$blocks = parse_blocks($content_with_ids);
		if ( !empty($blocks) && $blocks[0]['blockName'] === null ) {
			// Classic editor content, find first </p>
			$first_p = strpos( $content_with_ids, '</p>' );
			if ( $first_p !== false ) {
				return substr_replace( $content_with_ids, $toc_html, $first_p + 4, 0 );
			}
		}
		
		// Fallback: insert at the beginning
		return $toc_html . $content_with_ids;
	}

	/**
	 * Enqueue TOC assets.
	 */
	public function frontend_assets() {
		// Only load if TOC is enabled
		if ( $this->get_option_state( 'enable_toc' ) ) {
			$css = "
			.mm1-toc {
				background: #f9f9f9;
				border: 1px solid #e0e0e0;
				border-radius: 8px;
				padding: 15px 20px;
				margin-bottom: 20px;
				max-width: 90%;
				width: fit-content;
			}
			.mm1-toc-title {
				font-size: 1.1em;
				font-weight: bold;
				margin: 0 0 10px 0;
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			.mm1-toc-toggle {
				background: none;
				border: none;
				color: var(--mm1-primary-color, #0A84FF);
				cursor: pointer;
				font-size: 0.9em;
				padding: 0 5px;
			}
			.mm1-toc-list {
				transition: all 0.2s ease-in-out;
				overflow: hidden;
			}
			.mm1-toc-list ol {
				margin: 0;
				padding-left: 20px;
			}
			.mm1-toc-list ol ol {
				padding-left: 15px;
				margin-top: 5px;
				margin-bottom: 5px;
			}
			.mm1-toc-list li {
				margin-bottom: 5px;
			}
			.mm1-toc-list a {
				text-decoration: none;
			}
			.mm1-toc-list[hidden] {
				display: block; /* Override default hidden */
				max-height: 0;
				opacity: 0;
				margin-top: -10px;
			}
			.mm1-toc-list:not([hidden]) {
				max-height: 1000px; /* arbitrary high value */
				opacity: 1;
			}
			";
			wp_add_inline_style( 'wp-block-library', $css );

			$js = "
			document.addEventListener('DOMContentLoaded', function() {
				var toggles = document.querySelectorAll('.mm1-toc-toggle');
				toggles.forEach(function(toggle) {
					toggle.addEventListener('click', function() {
						var targetId = this.getAttribute('aria-controls');
						var target = document.getElementById(targetId);
						var text = this.querySelector('.mm1-toc-toggle-text');
						
						if (target) {
							var isExpanded = this.getAttribute('aria-expanded') === 'true';
							if (isExpanded) {
								this.setAttribute('aria-expanded', 'false');
								target.setAttribute('hidden', 'true');
								text.textContent = 'hiện';
							} else {
								this.setAttribute('aria-expanded', 'true');
								target.removeAttribute('hidden');
								text.textContent = 'ẩn';
							}
						}
					});
				});
			});
			";
			wp_add_inline_script( 'wp-block-library', $js, 'after' );
		}
	}
	
	// =========================================================================
	// 6. Internal Linking
	// =========================================================================
	
	/**
	 * Apply internal linking rules to content.
	 */
	public function internal_linking( $content ) {
		if ( ! is_singular() || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}

		$rules_text = $this->get_option_value( 'link_rules', '' );
		if ( empty( $rules_text ) ) {
			return $content;
		}
		
		$rules = $this->parse_rules( $rules_text, '->' );
		if ( empty( $rules ) ) {
			return $content;
		}
		
		// Get current post URL to avoid linking to self
		$current_url = get_permalink( get_the_ID() );

		// Use DOMDocument to safely replace text nodes
		libxml_use_internal_errors( true );
		$dom = new DOMDocument();
		// Load HTML, ensuring UTF-8 encoding
		$dom->loadHTML( mb_convert_encoding( $content, 'HTML-ENTITIES', 'UTF-8' ), LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
		libxml_clear_errors();
		
		$xpath = new DOMXPath( $dom );
		
		// Find all text nodes that are not inside excluded tags
		$nodes = $xpath->query( '//text()[not(ancestor::a) and not(ancestor::h1) and not(ancestor::code) and not(ancestor::pre) and not(ancestor::script) and not(ancestor::style)]' );
		
		if ( ! $nodes ) {
			return $content;
		}
		
		$applied_keywords = array();

		foreach ( $rules as $keyword => $url ) {
			// Skip self-linking
			if ( trailingslashit( $url ) === trailingslashit( $current_url ) ) {
				continue;
			}
			
			// Skip if this keyword was already applied (even if by another rule)
			if ( in_array( $keyword, $applied_keywords, true ) ) {
				continue;
			}
			
			$keyword_len = mb_strlen( $keyword );

			foreach ( $nodes as $node ) {
				// Case-insensitive search
				$pos = mb_stripos( $node->nodeValue, $keyword );
				
				if ( $pos !== false ) {
					// Found it. Split the node.
					// 1. Get original text
					$original_text = $node->nodeValue;
					
					// 2. Get text *before* keyword
					$before_text = mb_substr( $original_text, 0, $pos );
					
					// 3. Get keyword text (maintaining original case)
					$keyword_text = mb_substr( $original_text, $pos, $keyword_len );
					
					// 4. Get text *after* keyword
					$after_text = mb_substr( $original_text, $pos + $keyword_len );
					
					// 5. Create new nodes
					$before_node = $dom->createTextNode( $before_text );
					
					$link_node = $dom->createElement( 'a', $keyword_text );
					$link_node->setAttribute( 'href', esc_url( $url ) );
					
					$after_node = $dom->createTextNode( $after_text );
					
					// 6. Replace the original text node with the new nodes
					$parent = $node->parentNode;
					if ( $parent ) {
						if ( ! empty( $before_text ) ) {
							$parent->insertBefore( $before_node, $node );
						}
						$parent->insertBefore( $link_node, $node );
						if ( ! empty( $after_text ) ) {
							$parent->insertBefore( $after_node, $node );
						}
						$parent->removeChild( $node );
					}
					
					// Mark this keyword as applied and stop searching for this rule
					$applied_keywords[] = $keyword;
					break; 
				}
			}
		}

		// Save HTML
		return $dom->saveHTML();
	}
	
	/**
	 * Helper: Parse rules from textarea.
	 */
	private function parse_rules( $text, $separator ) {
		$rules = array();
		$lines = explode( "\n", $text );
		foreach ( $lines as $line ) {
			$parts = explode( $separator, $line, 2 );
			if ( count( $parts ) === 2 ) {
				$key = trim( $parts[0] );
				$val = trim( $parts[1] );
				if ( ! empty( $key ) && ! empty( $val ) ) {
					$rules[ $key ] = $val;
				}
			}
		}
		// Sort by key length, longest first, to match "xe máy điện" before "xe máy"
		uksort( $rules, function( $a, $b ) {
			return mb_strlen( $b ) - mb_strlen( $a );
		} );
		return $rules;
	}
	
	// =========================================================================
	// 7. Related Posts
	// =========================================================================

	/**
	 * Append related posts to content.
	 */
	public function related_posts( $content ) {
		if ( ! is_singular( 'post' ) || ! in_the_loop() || ! is_main_query() ) {
			return $content;
		}
		
		$post_id = get_the_ID();
		$transient_key = 'mm1_related_' . $post_id;
		
		$related_html = get_transient( $transient_key );
		
		if ( false === $related_html ) {
			$categories = wp_get_post_categories( $post_id );
			$tags = wp_get_post_tags( $post_id, array( 'fields' => 'ids' ) );
			
			if ( empty( $categories ) && empty( $tags ) ) {
				return $content;
			}
			
			$args = array(
				'post_type' => 'post',
				'post_status' => 'publish',
				'posts_per_page' => 6,
				'post__not_in' => array( $post_id ),
				'tax_query' => array(
					'relation' => 'OR',
					array(
						'taxonomy' => 'category',
						'field' => 'term_id',
						'terms' => $categories,
					),
					array(
						'taxonomy' => 'post_tag',
						'field' => 'term_id',
						'terms' => $tags,
					),
				),
				'orderby' => 'rand', // Simple ordering
			);
			
			$query = new WP_Query( $args );
			
			if ( $query->have_posts() ) {
				$related_html = '<div class="mm1-related-posts">';
				$related_html .= '<h4>Bài viết liên quan</h4>';
				$related_html .= '<ul>';
				while ( $query->have_posts() ) {
					$query->the_post();
					$related_html .= '<li>';
					if ( has_post_thumbnail() ) {
						$related_html .= '<a href="' . get_permalink() . '" class="mm1-related-thumb">' . get_the_post_thumbnail( get_the_ID(), 'thumbnail' ) . '</a>';
					}
					$related_html .= '<a href="' . get_permalink() . '" class="mm1-related-title">' . get_the_title() . '</a>';
					$related_html .= '</li>';
				}
				$related_html .= '</ul>';
				$related_html .= '</div>';
				
				wp_reset_postdata();
				
				// Add inline style
				$related_css = "
				<style>
				.mm1-related-posts { margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
				.mm1-related-posts h4 { font-size: 1.2em; margin-bottom: 15px; }
				.mm1-related-posts ul { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
				.mm1-related-posts li { margin: 0; padding: 0; }
				.mm1-related-posts .mm1-related-thumb { display: block; margin-bottom: 8px; }
				.mm1-related-posts .mm1-related-thumb img { width: 100%; height: auto; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; }
				.mm1-related-posts .mm1-related-title { text-decoration: none; font-weight: 500; font-size: 0.95em; }
				@media (min-width: 600px) {
					.mm1-related-posts ul { grid-template-columns: repeat(3, 1fr); }
				}
				</style>
				";
				
				$related_html = $related_css . $related_html;
				
				set_transient( $transient_key, $related_html, DAY_IN_SECONDS );
			} else {
				// Set empty transient to avoid re-query
				set_transient( $transient_key, '', DAY_IN_SECONDS );
			}
		}
		
		return $content . $related_html;
	}

	// =========================================================================
	// 8. HTML Sitemap
	// =========================================================================

	/**
	 * Render [mm1_sitemap] shortcode.
	 */
	public function sitemap_shortcode() {
		$output = '<div class="mm1-sitemap">';
		
		$post_types = get_post_types( array( 'public' => true, '_builtin' => false ), 'objects' );
		$post_types['post'] = get_post_type_object( 'post' );
		$post_types['page'] = get_post_type_object( 'page' );
		
		foreach ( $post_types as $pt ) {
			if ( $pt->name === 'attachment' ) continue;
			
			$query = new WP_Query( array(
				'post_type' => $pt->name,
				'posts_per_page' => -1,
				'post_status' => 'publish',
				'orderby' => 'title',
				'order' => 'ASC',
			) );
			
			if ( $query->have_posts() ) {
				$output .= '<h2>' . esc_html( $pt->labels->name ) . '</h2>';
				$output .= '<ul>';
				while ( $query->have_posts() ) {
					$query->the_post();
					$output .= '<li><a href="' . get_permalink() . '">' . get_the_title() . '</a></li>';
				}
				$output .= '</ul>';
				wp_reset_postdata();
			}
		}
		
		$output .= '</div>';
		return $output;
	}
	
	// =========================================================================
	// 9. Auto Writer
	// =========================================================================

	/**
	 * Add Writer Metabox.
	 */
	public function add_writer_metabox() {
		add_meta_box(
			'mm1_writer_metabox',
			'MotoMax Auto Writer (Offline)',
			array( $this, 'writer_metabox_html' ),
			null, // All post types
			'side',
			'high'
		);
	}

	/**
	 * Render Writer Metabox HTML.
	 */
	public function writer_metabox_html( $post ) {
		wp_nonce_field( 'mm1_save_writer_meta', 'mm1_writer_nonce' );
		$topic = get_post_meta( $post->ID, '_mm1_writer_topic', true );
		?>
		<style>
			.mm1-writer-field { margin-bottom: 10px; }
			.mm1-writer-field label { display: block; margin-bottom: 5px; }
			.mm1-writer-field input { width: 100%; }
			.mm1-writer-field .mm1-writer-btn { width: 100%; margin-top: 5px; }
			#mm1-writer-result { margin-top: 10px; }
		</style>
		<div class="mm1-writer-field">
			<label for="mm1_writer_topic">Chủ đề / Keyword</label>
			<input type="text" id="mm1_writer_topic" name="mm1_writer_topic" value="<?php echo esc_attr( $topic ); ?>">
		</div>
		<div class="mm1-writer-field">
			<label for="mm1_writer_min">Độ dài (min/max)</label>
			<input type="number" id="mm1_writer_min" name="mm1_writer_min" value="500" style="width: 48%;" placeholder="Min">
			<input type="number" id="mm1_writer_max" name="mm1_writer_max" value="1000" style="width: 48%; float: right;" placeholder="Max">
		</div>
		<div class="mm1-writer-field">
			<button type="button" class="button mm1-writer-btn" data-action="mm1_generate_content">
				Sinh nội dung (Đơn giản)
			</button>
			<div id="mm1-writer-result"></div>
		</div>
		<p class="description">Đây là trình tạo nội dung rule-based cơ bản, không dùng AI. Chỉ dùng để tạo nội dung stub/thử nghiệm.</p>
		<?php
	}
	
	/**
	 * Save Writer Metabox data (topic).
	 */
	public function save_writer_metabox( $post_id ) {
		if ( ! isset( $_POST['mm1_writer_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['mm1_writer_nonce'] ), 'mm1_save_writer_meta' ) ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		
		if ( isset( $_POST['mm1_writer_topic'] ) ) {
			update_post_meta( $post_id, '_mm1_writer_topic', sanitize_text_field( $_POST['mm1_writer_topic'] ) );
		}
	}
	
	/**
	 * AJAX handler for generating content.
	 */
	public function ajax_generate_content() {
		check_ajax_referer( 'mm1_save_writer_meta', 'nonce' );

		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( array( 'message' => 'Không có quyền.' ) );
		}

		$topic = isset( $_POST['topic'] ) ? sanitize_text_field( $_POST['topic'] ) : '';
		$min   = isset( $_POST['min'] ) ? absint( $_POST['min'] ) : 500;
		
		if ( empty( $topic ) ) {
			wp_send_json_error( array( 'message' => 'Thiếu chủ đề.' ) );
		}
		
		// Simple Rule-Based Generation (Stub)
		$html = $this->generate_stub_content( $topic, $min );

		wp_send_json_success( array( 'html' => $html ) );
	}
	
	/**
	 * Run scheduled writer to create drafts.
	 */
	public function run_scheduled_writer() {
		$topics_text = $this->get_option_value( 'writer_topics', '' );
		if ( empty( $topics_text ) ) {
			return; // No topics
		}
		
		$topics = explode( "\n", $topics_text );
		$topics = array_map( 'trim', $topics );
		$topics = array_filter( $topics );
		
		if ( empty( $topics ) ) {
			return;
		}
		
		// Pick a random topic
		$key = array_rand( $topics );
		$topic = $topics[ $key ];
		
		// Remove this topic from the list
		unset( $topics[ $key ] );
		$new_topics_text = implode( "\n", $topics );
		$this->options['writer_topics'] = $new_topics_text;
		update_option( MM1_OPTION_NAME, $this->options );
		
		// Generate content
		$title = 'Bài viết về: ' . $topic;
		$content = $this->generate_stub_content( $topic, 800 );
		
		// Create draft post
		$post_data = array(
			'post_title' => sanitize_text_field( $title ),
			'post_content' => wp_kses_post( $content ),
			'post_status' => 'draft',
			'post_author' => $this->get_option_value( 'writer_author_id', 1 ),
			'post_type' => $this->get_option_value( 'writer_post_type', 'post' ),
		);
		
		$post_id = wp_insert_post( $post_data );
		
		if( $post_id && !is_wp_error($post_id) ) {
			// Save topic to meta
			update_post_meta( $post_id, '_mm1_writer_topic', $topic );
		}
	}
	
	/**
	 * Helper: Generate stub content (Rule-based).
	 */
	private function generate_stub_content( $topic, $min_words = 500 ) {
		$lorem = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
		
		$html = '<h2>Giới thiệu về ' . esc_html( $topic ) . '</h2>';
		$html .= '<p>' . $lorem . ' Chủ đề chính là <strong>' . esc_html( $topic ) . '</strong>. ' . $lorem . '</p>';
		$html .= '<h2>Phân tích ' . esc_html( $topic ) . '</h2>';
		$html .= '<p>' . $lorem . '</p>';
		$html .= '<h3>Ưu điểm</h3>';
		$html .= '<ul><li>Ưu điểm 1 của ' . esc_html( $topic ) . '</li><li>Ưu điểm 2</li></ul>';
		$html .= '<h3>Nhược điểm</h3>';
		$html .= '<p>' . $lorem . '</p>';
		$html .= '<h2>Kết luận về ' . esc_html( $topic ) . '</h2>';
		$html .= '<p>' . $lorem . ' Tổng kết lại, ' . esc_html( $topic ) . ' là một chủ đề quan trọng. ' . $lorem . '</p>';
		
		// Pad content to reach min words
		$word_count = str_word_count( strip_tags( $html ) );
		while( $word_count < $min_words ) {
			$html .= '<p>' . $lorem . '</p>';
			$word_count = str_word_count( strip_tags( $html ) );
		}
		
		return $html;
	}

	// =========================================================================
	// 10. Analytics
	// =========================================================================

	/**
	 * Track post views.
	 */
	public function track_post_view() {
		if ( ! is_singular( 'post' ) ) {
			return;
		}

		// Don't track logged-in users (admins/editors)
		if ( current_user_can( 'edit_posts' ) ) {
			return;
		}
		
		// Don't track bots (simple check)
		if( isset($_SERVER['HTTP_USER_AGENT']) && preg_match('/bot|crawl|slurp|spider/i', $_SERVER['HTTP_USER_AGENT']) ) {
			return;
		}
		
		$post_id = get_the_ID();
		
		// Use a session cookie to prevent re-counting on refresh
		$cookie_name = 'mm1_viewed_' . $post_id;
		if( isset($_COOKIE[$cookie_name]) ) {
			return;
		}
		
		$count = (int) get_post_meta( $post_id, '_mm1_post_views', true );
		$count++;
		update_post_meta( $post_id, '_mm1_post_views', $count );
		
		// Set cookie for 1 hour
		setcookie( $cookie_name, '1', time() + 3600, COOKIEPATH, COOKIE_DOMAIN );
	}
	
	/**
	 * Render Reports Page.
	 */
	public function reports_page_html() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<style>
			.mm1-reports-table { width: 100%; max-width: 800px; background: #fff; border-collapse: collapse; margin-top: 20px; }
			.mm1-reports-table th, .mm1-reports-table td { border: 1px solid #ccd0d4; padding: 10px; text-align: left; }
			.mm1-reports-table th { background: #f0f0f1; }
			.mm1-reports-table td:last-child { width: 120px; text-align: center; font-weight: bold; }
		</style>
		<div class="wrap mm1-wrap">
			<h1><?php esc_html_e( 'Báo cáo hiệu suất (MotoMax)', 'motomax-onefile' ); ?></h1>
			<p>Danh sách bài viết được xem nhiều nhất (chỉ đếm lượt xem từ khách truy cập, không tính admin/editor).</p>
			
			<?php
			$query = new WP_Query( array(
				'post_type' => 'post',
				'post_status' => 'publish',
				'posts_per_page' => 50,
				'meta_key' => '_mm1_post_views',
				'orderby' => 'meta_value_num',
				'order' => 'DESC',
			) );
			
			if ( $query->have_posts() ) :
			?>
			<table class="mm1-reports-table">
				<thead>
					<tr>
						<th>Bài viết</th>
						<th>Lượt xem</th>
					</tr>
				</thead>
				<tbody>
					<?php while ( $query->have_posts() ) : $query->the_post(); ?>
						<tr>
							<td>
								<a href="<?php the_permalink(); ?>" target="_blank"><?php the_title(); ?></a>
								<small>(<a href="<?php echo get_edit_post_link(); ?>">Sửa</a>)</small>
							</td>
							<td><?php echo (int) get_post_meta( get_the_ID(), '_mm1_post_views', true ); ?></td>
						</tr>
					<?php endwhile; ?>
				</tbody>
			</table>
			<?php 
			wp_reset_postdata();
			else: ?>
				<p>Chưa có dữ liệu lượt xem.</p>
			<?php endif; ?>
		</div>
		<?php
	}
	
	// =========================================================================
	// 11. Redirect & 404
	// =========================================================================
	
	/**
	 * Handle 301 Redirects and Log 404s.
	 */
	public function redirect_404_handler() {
		// --- 301 Redirects ---
		$rules_text = $this->get_option_value( 'redirect_rules', '' );
		if ( ! empty( $rules_text ) ) {
			$rules = $this->parse_rules( $rules_text, '->' );
			$request_uri = $_SERVER['REQUEST_URI'] ?? '';
			
			if( !empty($request_uri) && isset($rules[$request_uri]) ) {
				$destination = $rules[$request_uri];
				wp_redirect( $destination, 301 );
				exit;
			}
		}

		// --- 404 Logging ---
		if ( is_404() && $this->get_option_state( 'enable_404_log' ) ) {
			// Don't log common junk requests
			$request_uri = $_SERVER['REQUEST_URI'] ?? '';
			if ( empty($request_uri) || preg_match( '/\.(jpg|jpeg|png|gif|css|js|ico|xml|txt)$/i', $request_uri ) ) {
				return;
			}
			
			$logs = get_option( 'mm1_404_logs', array() );
			$key = sanitize_text_field( $request_uri );
			
			$logs[ $key ] = isset( $logs[ $key ] ) ? $logs[ $key ] + 1 : 1;
			
			// Keep log size manageable (e.g., 500 entries)
			if ( count( $logs ) > 500 ) {
				arsort( $logs ); // Keep the most frequent ones
				$logs = array_slice( $logs, 0, 500, true );
			}
			
			update_option( 'mm1_404_logs', $logs, 'no' ); // 'no' autoload
		}
	}
	
	// =========================================================================
	// Plugin Uninstall
	// =========================================================================

	/**
	 * Clean up on uninstall.
	 */
	public static function on_uninstall() {
		// Check if user wants to keep data
		$options = get_option( MM1_OPTION_NAME );
		if ( isset( $options['modules']['enable_uninstall_data'] ) && $options['modules']['enable_uninstall_data'] === 'on' ) {
			
			// Delete options
			delete_option( MM1_OPTION_NAME );
			delete_option( 'mm1_404_logs' );
			
			// Delete post meta
			delete_post_meta_by_key( '_mm1_seo_title' );
			delete_post_meta_by_key( '_mm1_seo_desc' );
			delete_post_meta_by_key( '_mm1_post_views' );
			delete_post_meta_by_key( '_mm1_writer_topic' );
			
			// Delete transients
			global $wpdb;
			$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE '\_transient\_mm1\_%'" );
			$wpdb->query( "DELETE FROM $wpdb->options WHERE option_name LIKE '\_transient\_timeout\_mm1\_%'" );
			
			// Clear cron
			wp_clear_scheduled_hook( 'mm1_scheduled_writer_hook' );
		}
	}

}

// Instantiate the plugin
MotoMax_OneFile_Core::get_instance();

