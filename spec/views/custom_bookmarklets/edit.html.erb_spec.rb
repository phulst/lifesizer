require 'spec_helper'

describe "custom_bookmarklets/edit.html.erb" do
  before(:each) do
    cb = CustomBookmarklet.new
    cb.stubs(:name => 'MyString', :script => 'MyText', :id => 1)
    @custom_bookmarklet = assign(:custom_bookmarklet, cb)
  end

  it "renders the edit custom_bookmarklet form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form", :action => custom_bookmarklets_path(@custom_bookmarklet), :method => "post" do
      assert_select "input#custom_bookmarklet_name", :name => "custom_bookmarklet[name]"
      assert_select "textarea#custom_bookmarklet_script", :name => "custom_bookmarklet[script]"
    end
  end
end
