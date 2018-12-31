require 'spec_helper'

describe "custom_bookmarklets/new.html.erb" do
  before(:each) do
    cb = CustomBookmarklet.new
    cb.stubs(:name => 'MyString', :script => 'MyText')
    assign(:custom_bookmarklet, cb)
  end

  it "renders new custom_bookmarklet form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form", :action => custom_bookmarklets_path, :method => "post" do
      assert_select "input#custom_bookmarklet_name", :name => "custom_bookmarklet[name]"
      assert_select "textarea#custom_bookmarklet_script", :name => "custom_bookmarklet[script]"
    end
  end
end
