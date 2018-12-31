require "spec_helper"

describe CustomBookmarkletsController do
  describe "routing" do

    it "routes to #index" do
      get("/custom_bookmarklets").should route_to("custom_bookmarklets#index")
    end

    it "routes to #new" do
      get("/custom_bookmarklets/new").should route_to("custom_bookmarklets#new")
    end

    it "routes to #show" do
      get("/custom_bookmarklets/1").should route_to("custom_bookmarklets#show", :id => "1")
    end

    it "routes to #edit" do
      get("/custom_bookmarklets/1/edit").should route_to("custom_bookmarklets#edit", :id => "1")
    end

    it "routes to #create" do
      post("/custom_bookmarklets").should route_to("custom_bookmarklets#create")
    end

    it "routes to #update" do
      put("/custom_bookmarklets/1").should route_to("custom_bookmarklets#update", :id => "1")
    end

    it "routes to #destroy" do
      delete("/custom_bookmarklets/1").should route_to("custom_bookmarklets#destroy", :id => "1")
    end

    it "should route the bookmarklet script paths" do
      get('bmjs/10.js').should route_to(:controller => 'custom_bookmarklets', :action => 'script', :id => '10' )
    end
  end
end