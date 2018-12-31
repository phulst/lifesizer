require 'httparty'

# adds support for Google shopping API
class GoogleShopping
    include HTTParty

    API_KEY = 'google_api_key_goes_here'
    base_uri 'https://www.googleapis.com/shopping/search/v1'
    default_params :country => 'US', :alt => 'json', :key => API_KEY
    format :json

    def self.search(query, max_results)
      get('/public/products', :query => {:q => query, :maxResults => max_results})
    end
end
