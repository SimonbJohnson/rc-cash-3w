function generateDash(data,geom){
    console.log(data);
    var cf = crossfilter(data);
        cf.whereDim = cf.dimension(function(d){return d['#country+code']});
        cf.whoDim = cf.dimension(function(d){return d['#org']});
        cf.whatDim = cf.dimension(function(d){return d['#sector']});
        cf.modalityDim = cf.dimension(function(d){return d['#modality']});

        cf.whereGroup = cf.whereDim.group();
        cf.whoGroup = cf.whoDim.group();
        cf.whatGroup = cf.whatDim.group();
        cf.modalityGroup = cf.modalityDim.group();

        var fundingall = cf.groupAll().reduceSum(function(d) {
            if(isNaN(d['#value+total'])){
                return 0;
            } else {
                return d['#value+total'];
            }
        });

        var fundingQuality = cf.groupAll().reduceSum(function(d) {
            if(isNaN(d['#value+total'])){
                return 1;
            } else {
                return 0;
            }
        });

        var all = cf.groupAll();

        cf.whoChart = dc.rowChart('#whochart');
        cf.whatChart = dc.rowChart('#whatchart');
        cf.whereChart = dc.leafletChoroplethChart('#wherechart');
        cf.modalityChart = dc.rowChart('#modalitychart');

        cf.whoChart.width($('#whochart').width()).height(2000)
            .dimension(cf.whoDim)
            .group(cf.whoGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis({ tickSize: [0, 0]});

        cf.whatChart.width($('#whatchart').width()).height(300)
            .dimension(cf.whatDim)
            .group(cf.whatGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis().ticks(5);

        cf.modalityChart.width($('#modalitychart').width()).height(300)
            .dimension(cf.modalityDim)
            .group(cf.modalityGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis().ticks(5);            

        dc.axisChart('#row-axis')
            .width($('#whatchart').width()).height(50)
            .dimension( cf.whoDim )
            .group( cf.whoGroup )
            .elasticX( true )
            .xAxis().ticks(5);            

        cf.whereChart.width($('#wherechart').width()).height(700)
            .dimension(cf.whereDim)
            .group(cf.whereGroup)
            .center([0,0])
            .zoom(1)    
            .geojson(geom)
            .colors(['#999999', '#B71C1C'])
            .colorDomain([0, 1])
            .colorAccessor(function (d) {
                var c=0;
                if (d>0) {
                    c=1;
                }
                    return c;
                })          
            .featureKeyAccessor(function(feature){
                return feature.properties['ISO_A3'];
            })
            .popup(function(feature){
                return feature.properties['NAME'];
            })
            .renderPopup(true)
            .featureOptions({
                'fillColor': '#cccccc',
                'color': '#cccccc',
                'opacity':1,
                'fillOpacity': 0,
                'weight': 1
            });

        cf.whereChart.on("postRedraw",(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += l+", ";
                });
                $('#mapfilter').html(html);
            }));      

        dc.dataTable("#data-table")
            .dimension(cf.whereDim)                
            .group(function (d) {
                    return 0;
            })
            .ordering(function(d){ return -d.value })
            .size(650)
            .columns([
                function(d){
                   return d['#country+name']; 
                },
                function(d){
                   return d['#org']; 
                },
                function(d){
                   return d['#sector']; 
                },
                function(d){
                   return d['#modality']; 
                },
                function(d){
                   return d['#value+total']; 
                },
                function(d){
                    if (d['#date'] instanceof Date){
                        return d['#date'].getFullYear();
                    } else {
                        return 'No Data';
                    }
                }                                                  
            ]).sortBy(function(d) {
                return d['#country+name'];
            });

        dc.dataCount("#total")
            .dimension(cf)
            .group(fundingall);

        dc.dataCount("#totalquality")
            .dimension(cf)
            .group(fundingQuality);            

        dc.dataCount("#count-info")
            .dimension(cf)
            .group(all);                                    

            dc.renderAll();

    var g = d3.selectAll('#row-axis').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#whochart').width()/2)
        .attr('y', 700)
        .text('Activities');

    var g = d3.selectAll('#whatchart').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#whatchart').width()/2)
        .attr('y', 700)
        .text('Activities');            

            $('#reset').on('click',function(){
                dc.filterAll();
                dc.redrawAll();
            }); 
}

function hxlProxyToJSON(input,headers){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();                    
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

var dataCall = $.ajax({ 
    type: 'GET', 
    url: 'https://proxy.hxlstandard.org/data.json?url=https%3A//docs.google.com/spreadsheets/d/1s-piTxQUT0Q8ReO6uVy-72ZFb3R9K3I5zAnb2YNN83c/edit%3Fusp%3Dsharing&strip-headers=on&force=on',
    dataType: 'json',
});

var geomCall = $.ajax({ 
    type: 'GET', 
    url: '/data/world.json', 
    dataType: 'json'
});

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var data = dataArgs[0];
    data = hxlProxyToJSON(data);
    var parseDateFormat = d3.time.format("%Y-%m-%d").parse;
    data.forEach(function(d){
         d['#date'] = parseDateFormat(d['#date']);
    });
    var geom = topojson.feature(geomArgs[0],geomArgs[0].objects.geom);
    generateDash(data,geom);
});