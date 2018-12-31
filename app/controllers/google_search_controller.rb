# copyright 2011 LifeSizer, Inc. - all rights reserved
#
class GoogleSearchController < ApplicationController

  # renders the google search page
  def index
    search = params[:q]
    if search
      response = GoogleShopping.search(search, 50).parsed_response

      @products = nil
      if response['items']
        # create the list of WebProducts
        @products = response['items'].collect { |item| WebProduct.from_google(item)}

        # remove all products that don't have images
        @products = @products.delete_if { |p| !p.has_images? }
      end

      if @products && !@products.empty?
        logger.info("Google search for '#{search}' returned #{@products.length} products")
      end
    end
  end
end
