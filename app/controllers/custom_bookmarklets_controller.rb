class CustomBookmarkletsController < ApplicationController
  before_filter :authenticate_admin!, :except => 'script'

  # GET /custom_bookmarklets
  # GET /custom_bookmarklets.xml
  def index
    @custom_bookmarklets = CustomBookmarklet.all

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @custom_bookmarklets }
    end
  end

  # GET /custom_bookmarklets/1
  # GET /custom_bookmarklets/1.xml
  def show
    @custom_bookmarklet = CustomBookmarklet.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @custom_bookmarklet }
    end
  end

  # GET /custom_bookmarklets/new
  # GET /custom_bookmarklets/new.xml
  def new
    @custom_bookmarklet = CustomBookmarklet.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @custom_bookmarklet }
    end
  end

  # GET /custom_bookmarklets/1/edit
  def edit
    @custom_bookmarklet = CustomBookmarklet.find(params[:id])
    @users = @custom_bookmarklet.users
  end

  # POST /custom_bookmarklets
  # POST /custom_bookmarklets.xml
  def create
    @custom_bookmarklet = CustomBookmarklet.new(params[:custom_bookmarklet])

    respond_to do |format|
      if @custom_bookmarklet.save
        format.html { redirect_to(@custom_bookmarklet, :notice => 'Custom bookmarklet was successfully created.') }
        format.xml  { render :xml => @custom_bookmarklet, :status => :created, :location => @custom_bookmarklet }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @custom_bookmarklet.errors, :status => :unprocessable_entity }
      end
    end
  end

  # PUT /custom_bookmarklets/1
  # PUT /custom_bookmarklets/1.xml
  def update
    @custom_bookmarklet = CustomBookmarklet.find(params[:id])

    respond_to do |format|
      if @custom_bookmarklet.update_attributes(params[:custom_bookmarklet])
        format.html { redirect_to(@custom_bookmarklet, :notice => 'Custom bookmarklet was successfully updated.') }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @custom_bookmarklet.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /custom_bookmarklets/1
  # DELETE /custom_bookmarklets/1.xml
  def destroy
    @custom_bookmarklet = CustomBookmarklet.find(params[:id])
    @custom_bookmarklet.destroy

    respond_to do |format|
      format.html { redirect_to(custom_bookmarklets_url) }
      format.xml  { head :ok }
    end
  end

  # loads and returns a custom bookmarklet script
  def script
    key = params[:id]

    script = nil
    if key
      api_key = ApiKey.check_valid_key_for_write(key)
      if api_key
        ao = api_key.user.account_option
        script = ao.custom_bookmarklet.script if ao.custom_bookmarklet
      else
        logger.info("no valid key")
      end
    end

    if script
      render :js => script
    else
      render :status => 404, :nothing => true
    end
  end
end
