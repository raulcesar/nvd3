
nv.models.scatterChart = function() {

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin       = {top: 30, right: 20, bottom: 50, left: 60}
    , width        = null
    , height       = null
    , color        = nv.utils.defaultColor()
    //x            = scatter.xScale(),
    , x            = d3.fisheye.scale(d3.scale.linear).distortion(0)
    //y            = scatter.yScale(),
    , y            = d3.fisheye.scale(d3.scale.linear).distortion(0)
    , showDistX    = false
    , showDistY    = false
    , showLegend   = true
    , showControls = true
    , fisheye      = 0
    , pauseFisheye = false
    , tooltips     = true
    , tooltipX     = function(key, x, y) { return '<strong>' + x + '</strong>' }
    , tooltipY     = function(key, x, y) { return '<strong>' + y + '</strong>' }
    //, tooltip      = function(key, x, y) { return '<h3>' + key + '</h3>' }
    , tooltip      = null
    , scatter      = nv.models.scatter().xScale(x).yScale(y)
    , xAxis        = nv.models.axis().orient('bottom').tickPadding(10)
    , yAxis        = nv.models.axis().orient('left').tickPadding(10)
    , legend       = nv.models.legend().height(30)
    , controls     = nv.models.legend().height(30)
    , distX        = nv.models.distribution().axis('x')
    , distY        = nv.models.distribution().axis('y')
    , dispatch     = d3.dispatch('tooltipShow', 'tooltipHide')
    , noData       = "No Data Available."
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0;

  var showTooltip = function(e, offsetElement) {
    //TODO: make tooltip style an option between single or dual on axes (maybe on all charts with axes?)

    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        leftX = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        topX = y.range()[0] + margin.top + ( offsetElement.offsetTop || 0),
        leftY = x.range()[0] + margin.left + ( offsetElement.offsetLeft || 0 ),
        topY = e.pos[1] + ( offsetElement.offsetTop || 0),
        xVal = xAxis.tickFormat()(scatter.x()(e.point, e.pointIndex)),
        yVal = yAxis.tickFormat()(scatter.y()(e.point, e.pointIndex));

      if( tooltipX != null )
          nv.tooltip.show([leftX, topX], tooltipX(e.series.key, xVal, yVal, e, chart), 'n', 1, null, 'x-nvtooltip');
      if( tooltipY != null )
          nv.tooltip.show([leftY, topY], tooltipY(e.series.key, xVal, yVal, e, chart), 'e', 1, null, 'y-nvtooltip');
      if( tooltip != null )
          nv.tooltip.show([left, top], tooltip(e.series.key, xVal, yVal, e, chart), e.value < 0 ? 'n' : 's');
  };

  var controlsData = [
    { key: 'Magnify', disabled: true }
  ];

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;


      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        container.append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('x', availableWidth / 2)
          .attr('y', availableHeight / 2)
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle')
          .text(noData);
          return chart;
      } else {
        container.select('.nv-noData').remove();
      }

      //------------------------------------------------------------
      // Setup Scales

      x = scatter.xScale();
      y = scatter.yScale();

      x0 = x0 || x;
      y0 = y0 || y;

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-scatterChart').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-scatterChart nv-chart-' + scatter.id());
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      // background for pointer events
      gEnter.append('rect').attr('class', 'nvd3 nv-background')

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-scatterWrap');
      gEnter.append('g').attr('class', 'nv-distWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------


      if (showLegend) {
        legend.width( availableWidth / 2 );

        wrap.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        wrap.select('.nv-legendWrap')
            .attr('transform', 'translate(' + (availableWidth / 2) + ',' + (-margin.top) +')');
      }


      if (showControls) {
        controls.width(180).color(['#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }


      g.select('.nv-background')
          .attr('width', availableWidth)
          .attr('height', availableHeight);


      scatter
          .width(availableWidth)
          .height(availableHeight)
          .color(data.map(function(d,i) {
            return d.color || color(d, i);
          }).filter(function(d,i) { return !data[i].disabled }))

      wrap.select('.nv-scatterWrap')
          .datum(data.filter(function(d) { return !d.disabled }))
          .call(scatter);


      xAxis
          .scale(x)
          .ticks( availableWidth / 100 )
          .tickSize( -availableHeight , 0);

      g.select('.nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')')
          .call(xAxis);


      yAxis
          .scale(y)
          .ticks( availableHeight / 36 )
          .tickSize( -availableWidth, 0);

      g.select('.nv-y.nv-axis')
          .call(yAxis);


      distX
          .getData(scatter.x())
          .scale(x)
          .width(availableWidth)
          .color(data.map(function(d,i) {
            return d.color || color(d, i);
          }).filter(function(d,i) { return !data[i].disabled }));
      gEnter.select('.nv-distWrap').append('g')
          .attr('class', 'nv-distributionX')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      g.select('.nv-distributionX')
          .datum(data.filter(function(d) { return !d.disabled }))
          .call(distX);


      distY
          .getData(scatter.y())
          .scale(y)
          .width(availableHeight)
          .color(data.map(function(d,i) {
            return d.color || color(d, i);
          }).filter(function(d,i) { return !data[i].disabled }));
      gEnter.select('.nv-distWrap').append('g')
          .attr('class', 'nv-distributionY')
          .attr('transform', 'translate(-' + distY.size() + ',0)');
      g.select('.nv-distributionY')
          .datum(data.filter(function(d) { return !d.disabled }))
          .call(distY);


      g.select('.nv-background').on('mousemove', updateFisheye);
      g.select('.nv-background').on('click', function() { pauseFisheye = !pauseFisheye;});
      scatter.dispatch.on('elementClick.freezeFisheye', function() {
        pauseFisheye = !pauseFisheye;
      });


      function updateFisheye() {
        if (pauseFisheye) {
          g.select('.nv-point-paths').style('pointer-events', 'all');
          return false;
        }

        g.select('.nv-point-paths').style('pointer-events', 'none' );

        var mouse = d3.mouse(this);
        x.distortion(fisheye).focus(mouse[0]);
        y.distortion(fisheye).focus(mouse[1]);

        g.select('.nv-scatterWrap')
            .datum(data.filter(function(d) { return !d.disabled }))
            .call(scatter);
        g.select('.nv-x.nv-axis').call(xAxis);
        g.select('.nv-y.nv-axis').call(yAxis);
        g.select('.nv-distributionX')
            .datum(data.filter(function(d) { return !d.disabled }))
            .call(distX);
        g.select('.nv-distributionY')
            .datum(data.filter(function(d) { return !d.disabled }))
            .call(distY);
      }



      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      controls.dispatch.on('legendClick', function(d,i) {
        d.disabled = !d.disabled;

        fisheye = d.disabled ? 0 : 2.5;
        g.select('.nv-background') .style('pointer-events', d.disabled ? 'none' : 'all');
        g.select('.nv-point-paths').style('pointer-events', d.disabled ? 'all' : 'none' );

        if (d.disabled) {
          x.distortion(fisheye).focus(0);
          y.distortion(fisheye).focus(0);

          g.select('.nv-scatterWrap').call(scatter);
          g.select('.nv-x.nv-axis').call(xAxis);
          g.select('.nv-y.nv-axis').call(yAxis);
        } else {
          pauseFisheye = false;
        }

        chart(selection);
      });

      legend.dispatch.on('legendClick', function(d,i, that) {
        d.disabled = !d.disabled;

        if (!data.filter(function(d) { return !d.disabled }).length) {
          data.map(function(d) {
            d.disabled = false;
            wrap.selectAll('.nv-series').classed('disabled', false);
            return d;
          });
        }

        chart(selection);
      });

      /*
      legend.dispatch.on('legendMouseover', function(d, i) {
        d.hover = true;
        chart(selection);
      });

      legend.dispatch.on('legendMouseout', function(d, i) {
        d.hover = false;
        chart(selection);
      });
      */

      scatter.dispatch.on('elementMouseover.tooltip', function(e) {
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distx-' + e.pointIndex)
            .attr('y1', e.pos[1] - availableHeight);
        d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-disty-' + e.pointIndex)
            .attr('x2', e.pos[0] + distX.size());

        e.pos = [e.pos[0] + margin.left, e.pos[1] + margin.top];
        dispatch.tooltipShow(e);
      });

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });


      //store old scales for use in transitions on update
      x0 = x.copy();
      y0 = y.copy();


      chart.update = function() { chart(selection) };
      chart.container = this;

    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  scatter.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);

    d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-distx-' + e.pointIndex)
        .attr('y1', 0);
    d3.select('.nv-chart-' + scatter.id() + ' .nv-series-' + e.seriesIndex + ' .nv-disty-' + e.pointIndex)
        .attr('x2', distY.size());
  });
  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.legend = legend;
  chart.controls = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.distX = distX;
  chart.distY = distY;

  d3.rebind(chart, scatter, 'id', 'interactive', 'pointActive', 'x', 'y', 'shape', 'size', 'xScale', 'yScale', 'zScale', 'xDomain', 'yDomain', 'sizeDomain', 'sizeRange', 'forceX', 'forceY', 'forceSize', 'clipVoronoi', 'clipRadius');

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    legend.color(color);
    distX.color(color);
    distY.color(color);
    return chart;
  };

  chart.showDistX = function(_) {
    if (!arguments.length) return showDistX;
    showDistX = _;
    return chart;
  };

  chart.showDistY = function(_) {
    if (!arguments.length) return showDistY;
    showDistY = _;
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.fisheye = function(_) {
    if (!arguments.length) return fisheye;
    fisheye = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.tooltipXContent = function(_) {
    if (!arguments.length) return tooltipX;
    tooltipX = _;
    return chart;
  };

  chart.tooltipYContent = function(_) {
    if (!arguments.length) return tooltipY;
    tooltipY = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  //============================================================


  return chart;
}
