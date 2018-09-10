function generateDash(data,geom){
    
    $('.sp-circle').remove();
    $('#datatable').hide();
    var cf = crossfilter(data);
        cf.whereDim = cf.dimension(function(d){return d['#country+code']});
        cf.whoDim = cf.dimension(function(d){return d['#org+implementing']});
        cf.whatDim = cf.dimension(function(d){return d['#sector']});
        cf.modalityDim = cf.dimension(function(d){return d['#modality+restriction']});
        cf.deliveryDim = cf.dimension(function(d){return d['#channel']});

        cf.whereGroup = cf.whereDim.group().reduceSum(function(d) {return d['#reached']});
        cf.whoGroup = cf.whoDim.group().reduceSum(function(d) {return d['#reached']});
        cf.whatGroup = cf.whatDim.group().reduceSum(function(d) {return d['#reached']});
        cf.modalityGroup = cf.modalityDim.group().reduceSum(function(d) {return d['#reached']});
        cf.deliveryGroup = cf.deliveryDim.group().reduceSum(function(d) {return d['#reached']});

        var fundingall = cf.groupAll().reduceSum(function(d) {
            if(isNaN(parseInt(d['#value+cash+spent']))){
                return 0;
            } else {
                return parseInt(d['#value+cash+spent']);
            }
        });

        var fundingQuality = cf.groupAll().reduceSum(function(d) {
            if(isNaN(parseInt(d['#value+cash+spent']))){
                return 1;
            } else {
                return 0;
            }
        });

        var benall = cf.groupAll().reduceSum(function(d) {
            if(isNaN(parseInt(d['#reached']))){
                return 0;
            } else {
                return parseInt(d['#reached']);
            }
        });

        var benQuality = cf.groupAll().reduceSum(function(d) {
            if(isNaN(parseInt(d['#reached']))){
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
        cf.deliveryChart = dc.rowChart('#deliverychart');

        cf.whoChart.width($('#whochart').width()).height(2000)
            .dimension(cf.whoDim)
            .group(cf.whoGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis({ tickSize: [0, 0]});

        cf.whoChart.addFilterHandler(function (filters, filter) {
            filters.length = 0; // empty the array
            filters.push(filter);
            if(filters.length==0){
                $('#datatable').hide();
            } else {
                $('#datatable').show();
            }
            return filters;
        });   

        cf.whatChart.width($('#whatchart').width()).height(250)
            .dimension(cf.whatDim)
            .group(cf.whatGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis().ticks(3);

        cf.modalityChart.width($('#modalitychart').width()).height(130)
            .dimension(cf.modalityDim)
            .group(cf.modalityGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis().ticks(3);

        cf.deliveryChart.width($('#deliverychart').width()).height(160)
            .dimension(cf.deliveryDim)
            .group(cf.deliveryGroup)
            .elasticX(true)
            .colors(['#CCCCCC', '#EF9A9A'])
            .colorDomain([0,1])
            .colorAccessor(function(d, i){return 1;})
            .ordering(function(d){ return -d.value })
            .xAxis().ticks(3);                             

        dc.axisChart('#row-axis')
            .width($('#whatchart').width()).height(50)
            .dimension( cf.whoDim )
            .group( cf.whoGroup )
            .elasticX( true )
            .xAxis().ticks(3);            

        cf.whereChart.width($('#wherechart').width()).height(750)
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
                'opacity':0.5,
                'fillOpacity': 0,
                'weight': 0.5
            });

        /*cf.whereChart.on("postRedraw",(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += html+", ";
                });
                if(e.filters().length==0){
                    $('#datatable').hide();
                } else {
                    $('#datatable').show();
                }
                $('#mapfilter').html(html);
            }));)*/

        cf.whereChart.addFilterHandler(function (filters, filter) {
            filters.length = 0; // empty the array
            filters.push(filter);
            var html = "";
            filters.forEach(function(l){
                 html += html+", ";
            });
            if(filters.length==0){
                $('#datatable').hide();
            } else {
                $('#datatable').show();
            }
            $('#mapfilter').html(html);
            return filters;
        });      

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
                   return d['#org+implementing']; 
                },
                function(d){
                   return d['#sector']; 
                },
                function(d){
                   return d['#modality+restriction']; 
                },
                function(d){
                   return d['#channel']; 
                },
                function(d){
                    let value = parseInt(d['#reached']);
                    if(isNaN(value)){
                        return "No Data";
                    } else {
                        return value.toString().replace(/(<([^>]+)>)/ig,"").replace(/\B(?=(\d{3})+(?!\d))/g, ","); 
                    }
                },
                function(d){
                    let value = parseInt(d['#value+cash+spent']);
                    if(isNaN(value)){
                        return "No Data";
                    } else {
                        return value.toString().replace(/(<([^>]+)>)/ig,"").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

        dc.dataCount("#bentotal")
            .dimension(cf)
            .group(benall);

        dc.dataCount("#benquality")
            .dimension(cf)
            .group(benQuality);                         

        dc.dataCount("#count-info")
            .dimension(cf)
            .group(all);                                    



            dc.renderAll();

    var g = d3.selectAll('#row-axis').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#row-axis').width()/2)
        .attr('y', 46)
        .attr('class','axislabel')
        .text('No. beneficiaries');

    var g = d3.selectAll('#whatchart').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#whatchart').width()/2)
        .attr('y', 198)
        .attr('class','axislabel')
        .text('No. beneficiaries');            


    var g = d3.selectAll('#modalitychart').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#modalitychart').width()/2)
        .attr('y', 148)
        .attr('class','axislabel')
        .text('No. beneficiaries');    
            

    var g = d3.selectAll('#deliverychart').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#modalitychart').width()/2)
        .attr('y', 228)
        .attr('class','axislabel')
        .text('No. beneficiaries');

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
    url: 'https://proxy.hxlstandard.org/data.json?filter01=select&select-query01-01=%23date%2Byear%3D2017&filter02=replace-map&replace-map-url02=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1hTE0U3V8x18homc5KxfA7IIrv1Y9F1oulhJt0Z4z3zo%2Fedit%23gid%3D0&filter03=merge&merge-url03=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1GugpfyzridvfezFcDsl6dNlpZDqI8TQJw-Jx52obny8%2Fedit%23gid%3D0&merge-keys03=%23country%2Bname&merge-tags03=%23country%2Bcode&filter04=replace&replace-pattern04=%5E%24&replace-regex04=on&replace-value04=No+data&replace-tags04=%23sector%2C%23modality%2C%23channel-ecash&strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1s-piTxQUT0Q8ReO6uVy-72ZFb3R9K3I5zAnb2YNN83c%2Fedit%23gid%3D1496776846&force=on',
    dataType: 'json',
});

var geomCall = $.ajax({ 
    type: 'GET', 
    url: 'data/world.json', 
    dataType: 'json'
});

$.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
    var data = dataArgs[0];
    data = hxlProxyToJSON(data);
    var parseDateFormat = d3.time.format("%Y-%m-%d").parse;
    /*data.forEach(function(d){
         d['#date'] = parseDateFormat(d['#date']);
    });*/
    var geom = topojson.feature(geomArgs[0],geomArgs[0].objects.geom);
    generateDash(data,geom);
});