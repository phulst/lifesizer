# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130611063843) do

  create_table "account_options", :force => true do |t|
    t.integer  "user_id"
    t.integer  "account_type"
    t.integer  "max_images"
    t.boolean  "bookmarklet"
    t.integer  "bookmarklet_options"
    t.boolean  "ssl"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "custom_bookmarklet_id"
    t.boolean  "browser_plugin"
    t.integer  "browser_plugin_options"
    t.boolean  "demo_browser_plugin"
    t.integer  "demo_browser_plugin_options"
    t.boolean  "keep_cache",                  :default => false
    t.boolean  "default_private",             :default => false
  end

  create_table "api_keys", :force => true do |t|
    t.string   "key"
    t.string   "hostname"
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "access_type"
  end

  create_table "custom_bookmarklets", :force => true do |t|
    t.text     "script"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name"
  end

  create_table "delayed_jobs", :force => true do |t|
    t.integer  "priority",   :default => 0
    t.integer  "attempts",   :default => 0
    t.text     "handler"
    t.text     "last_error"
    t.datetime "run_at"
    t.datetime "locked_at"
    t.datetime "failed_at"
    t.string   "locked_by"
    t.string   "queue"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "delayed_jobs", ["priority", "run_at"], :name => "delayed_jobs_priority"

  create_table "devices", :force => true do |t|
    t.string   "vendor"
    t.string   "model"
    t.string   "device_name"
    t.string   "device_id",                             :null => false
    t.float    "ppi"
    t.float    "device_pixel_ratio", :default => 1.0
    t.float    "display_size"
    t.integer  "resolution_x"
    t.integer  "resolution_y"
    t.boolean  "verified",           :default => false
    t.datetime "created_at",                            :null => false
    t.datetime "updated_at",                            :null => false
    t.string   "device_type"
  end

  add_index "devices", ["device_id"], :name => "unique_device_id", :unique => true

  create_table "images", :force => true do |t|
    t.string   "original_url"
    t.string   "ref"
    t.integer  "width"
    t.integer  "height"
    t.float    "ppi"
    t.integer  "image_type"
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id"
    t.string   "calibrate_coords"
    t.integer  "calibrate_unit"
    t.float    "calibrate_length"
    t.string   "auto_ref"
    t.integer  "featured"
    t.string   "remote_upload_url"
    t.string   "upload"
    t.integer  "medium_width"
    t.integer  "medium_height"
    t.string   "page_url"
    t.boolean  "private",           :default => false
    t.string   "source"
    t.string   "guid"
    t.string   "old_filename"
  end

  add_index "images", ["guid"], :name => "index_images_on_guid"
  add_index "images", ["image_type"], :name => "index_images_on_image_type"
  add_index "images", ["private"], :name => "index_images_on_private"
  add_index "images", ["ref"], :name => "index_images_on_ref"
  add_index "images", ["user_id"], :name => "index_images_on_user_id"

  create_table "images_user_products", :force => true do |t|
    t.integer "image_id",        :null => false
    t.integer "user_product_id", :null => false
  end

  create_table "rails_admin_histories", :force => true do |t|
    t.text     "message"
    t.string   "username"
    t.integer  "item"
    t.string   "table"
    t.integer  "month",      :limit => 2
    t.integer  "year",       :limit => 8
    t.datetime "created_at",              :null => false
    t.datetime "updated_at",              :null => false
  end

  add_index "rails_admin_histories", ["item", "table", "month", "year"], :name => "index_rails_admin_histories"

  create_table "user_products", :force => true do |t|
    t.integer  "user_id",         :null => false
    t.string   "user_product_id", :null => false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "user_products", ["user_product_id", "user_id"], :name => "unique_product_id", :unique => true

  create_table "users", :force => true do |t|
    t.string   "email",                                 :default => "", :null => false
    t.string   "encrypted_password",     :limit => 128, :default => "", :null => false
    t.string   "password_salt",                         :default => "", :null => false
    t.string   "reset_password_token"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",                         :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "image_ref_count",                       :default => 0
    t.boolean  "admin"
    t.integer  "plan"
    t.datetime "reset_password_sent_at"
    t.string   "provider"
    t.string   "uid"
    t.string   "image_url"
    t.string   "provider_username"
    t.string   "provider_profile_url"
    t.string   "first_name"
    t.string   "last_name"
    t.string   "name"
  end

  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end
