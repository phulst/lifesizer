Lifesizer::Application.routes.draw do

  get "api/new"
  get "api/create"

  resources :user do
    resources :image, :controller => 'image_rest', :defaults => { :format => 'json' }
  end
  match '/user/:user_id/image', :to => 'image_rest#options', :constraints => {:method => 'OPTIONS'}, :defaults => { :format => 'json' }
  match '/user/:user_id/image/:id', :to => 'image_rest#options', :constraints => {:method => 'OPTIONS'}, :defaults => { :format => 'json' }
  match '/user/:user_id/prodimages/:id', :to => 'image_rest#product_images', :defaults => { :format => 'json' }

  match "google_search", :to => "google_search#index"
  match 'widget', :to => 'widget#index'
  get 'widget/popup'

  # view in popup window
  match '/view', :to => 'view#index'
  post '/view/screenres'
  # view in full browser window (link is SEO optimized)
  match '/fview(.:format)/:guid(/:name)', :to => 'view#fullview'

  # embed code / api pages
  get "embed/index"
  get "embed/app_key"
  get "embed/instructions"
  get "embed/howto"

  # admin pages
  get "admin/index"
  get "admin/images"
  match "admin/images/page/:page", :to => "admin#images"
  get "admin/users"
  get "admin/options"
  get "admin/screen_test"
  post "admin/api_options"
  post "admin/submit_options"

  get "admin/update_image_cache"
  get "admin/update_embed_cache"
  get "admin/update_bookmarklet_files"
  get "admin/update_shared_files"
  post "admin/sync_image_cache"
  post "admin/sync_bookmarklet"
  post "admin/become_user"
  match "admin/device_info"
  post "admin/change_featured"
  post "admin/change_private"
  delete "admin/delete_image"

  # account pages
  get "account/bookmarklet"
  get "account/home"

  # bookmarklet routes
  match 'bmjs/:id.js', :to => 'custom_bookmarklets#script' # deprecated

  match 'bmc/:id.js', :to => 'custom_bookmarklets#script'
  resources :custom_bookmarklets

  # custom plugins
  get "plugin/customer/demo/(:id)-demo.user.js", :to => 'plugin#customer_demo', :constraints => { :id =>  /[^\/]+/ }
  get "plugin/customer/:id.user.js", :to => 'plugin#customer'

  get "test/show_cookies"
  post "test/delete_lifesize"
  post "test/delete_screen"

  get  "calibrate/start" # deprecated
  post "calibrate/done"  # deprecated

  post "calibrate/save"
  post "calibrate/save_known"


  # no longer used
  #get "calibrate/start"
  #get "calibrate/intro_cal"
  #get "calibrate/done"
  #get "calibrate/cal"
  #get "calibrate/save"
  #get "calibrate/diam"

  # these are no longer used, right? should delete ShowController too
  #match "show", :to => "show#index"
  #get "show/index"
  #get "show/error"
  #get "show/render_info"

  get "configure/index"

  post "images/upload"
  get  "images/configure"
  post "images/configure"

  post "images/create_complete"

  get "images/recent"
  match "images/recent/page/:page", :to => 'images#recent'
  get "images/featured"
  get "images/popular"
  get "images/add_image"
  get "images/user"
  match "images/user/page/:page", :to => 'images#user'

  # ajax/remote endpoints
  get "images/remote_save"
  get "images/remote_get"
  get "images/user_cache"

  post "images/add_image"


  post "images/add_step_1"
  post "images/add_finish"
  get "images/check_img"
  # cache response
  match 'lsc/:key.js', :to => 'images#check_img', :callback => 'imageRefCache.notify'

  resources :images

  get "home/index"

  #match 'proxy' => 'proxy#index'

  # demo controller
  get "demo/image"

  devise_for :users, :controllers => { :registrations => "registrations", :omniauth_callbacks => "omniauth_callbacks" }
  devise_scope :user do
    match "/users/signed_up", :to => "registrations#complete", :controllers => {:registrations => "registrations"}, :as => "complete_user_registration", :via => :get
  end

  mount RailsAdmin::Engine => '/radmin', :as => 'rails_admin'


  #resources :images

  #resources :users do
  #  resources :images
  #end
  # The priority is based upon order of creation:
  # first created -> highest priority.

  # Sample of regular route:
  #   match 'products/:id' => 'catalog#view'
  # Keep in mind you can assign values other than :controller and :action

  # Sample of named route:
  #   match 'products/:id/purchase' => 'catalog#purchase', :as => :purchase
  # This route can be invoked with purchase_url(:id => product.id)

  # Sample resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Sample resource route with options:
  #   resources :products do
  #     member do
  #       get :short
  #       post :toggle
  #     end
  #
  #     collection do
  #       get :sold
  #     end
  #   end

  # Sample resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Sample resource route with more complex sub-resources
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get :recent, :on => :collection
  #     end
  #   end

  # Sample resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end

  # You can have the root of your site routed with "root"
  # just remember to delete public/index.html.
  root :to => "home#index"

  # See how all your routes lay out with "rake routes"

  # This is a legacy wild controller route that's not recommended for RESTful applications.
  # Note: This route will make all actions in every controller accessible via GET requests.
  # match ':controller(/:action(/:id(.:format)))'
end
