# renders the navigation elements when there are multiple images in a single viewer
# (next and previous buttons)
class LifeSizer.Views.ImageNavigator extends Backbone.View

  template: JST['viewer/image_navigator']

  initialize: ->
    $('#image-box').hover @hover, @hoverOut
    @currentImgIdx = 0

  events:
    'click .img-nav-btn.previous':  'previous'
    'click .img-nav-btn.next':      'next'

  render: ->
    $(@el).html(@template())
    this

  next: ->
    @currentImgIdx++
    @currentImgIdx = 0 if @currentImgIdx >= @collection.length
    lifeSizeViewer.trigger 'swapImage', @collection.at(@currentImgIdx)

  previous: ->
    @currentImgIdx--
    @currentImgIdx = @collection.length - 1 if @currentImgIdx < 0
    lifeSizeViewer.trigger 'swapImage', @collection.at(@currentImgIdx)

  hover: ->
    $('.img-nav-btn').fadeIn('slow')

  hoverOut: ->
    $('.img-nav-btn').fadeOut('fast')
