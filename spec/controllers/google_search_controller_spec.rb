require 'spec_helper'

describe GoogleSearchController do

  context 'google search' do
    context 'without parameters' do
      it "should handle GET" do
        get :index
        response.should be_success
      end

      it "should return no results without query" do
        post 'index'
        response.should be_success
        products = assigns(:products)
        products.should be_nil
      end
    end

    context 'with parameters' do
      it "should return results" do
        product_results_file = File.new('test/data/google/shopping_results.json')
        stub_request(:get, "https://www.googleapis.com/shopping/search/v1/public/products?alt=json&country=US&key=api_key&maxResults=50&q=tissot%20watch").
         to_return(:status => 200, :body => product_results_file, :headers => {})

        post :index, :q => 'tissot watch'
        response.should be_success
        products = assigns(:products)
        p1 = products[0]
        p1.should be_a(WebProduct)
        p1.has_images?.should be_true
        p1.name.should == 'Tissot Watch, Mens Stainless Steel Bracelet T17158642'
        # result 4 should have 2 images
        p4 = products[3]
        p4.image_urls.length.should == 2
      end
    end
  end
end
