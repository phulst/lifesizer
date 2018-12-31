window.LifeSizer =
  Models: {}
  Collections: {}
  Views: {}
  router: null

  assetHost: "http://assets.lifesizer.com"

  init: ->
    LsLog.info("initializing")

$(document).ready ->
  LifeSizer.init()
