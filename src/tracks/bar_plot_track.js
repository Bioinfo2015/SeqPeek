define   (
[
    'd3',
    'underscore',

    '../util/data_adapters',
    '../util/gene_region_utils',
    '../seqpeek_scaling'
],
function(
    d3,
    _,
    DataAdapters,
    GeneRegionUtils,
    ScalingFunctions
) {
    var BarPlotTrackPrototype = {
        getHeight: function() {
            return this.dimensions.height;
        },

        _applyStackedBarRenderData: function(data, data_info) {
            var self = this,
                render_info = {
                    min_height: 10.0,
                    max_height: 120.0,
                    pixels_per_sample: 200,
                    category_colors: self.config.color_scheme
                };

            DataAdapters.apply_to_variant_types(data, function(type_data, memo) {
                type_data.render_data = ScalingFunctions.createNormalizedLinearBars(type_data, type_data.statistics.by_category, render_info);
            });
        },

        _updateVisibleData: function() {
            var visible_coordinates = this._getRenderingContext().getVisibleCoordinates(),
                start = visible_coordinates[0],
                stop = visible_coordinates[1];

            this.visible_data = _.chain(this.location_data)
                .filter(function(data) {
                    return start <= data.coordinate && data.coordinate <= stop;
                })
                .value();
        },

        _buildBarRenderData: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                variant_layout = this.getVariantLayout(),
                viewport_x = ctx.getViewportPosition().x,
                bar_rendering_data = [];

            DataAdapters.apply_to_variant_types(this.visible_data, function(type_data, memo, data_by_location)  {
                var coordinate = data_by_location.coordinate;

                _.each(type_data.render_data.array, function(bar_data) {
                    bar_rendering_data.push(_.extend(bar_data, {
                        screen_x: variant_layout.getScreenLocationForVariant(coordinate, type_data) + viewport_x - self.config.bar_width / 2.0
                    }));
                });
            }, {});

            this.render_data.bars = bar_rendering_data;
        },

        _buildStemRenderData: function() {
            var self = this,
                ctx = this._getRenderingContext(),
                variant_layout = this.getVariantLayout(),
                viewport_x = ctx.getViewportPosition().x;

            var stem_rendering_data = [];

            GeneRegionUtils.iterateDataWithRegions(this.region_data, this.visible_data, 'coordinate', function(d) {
                var region = d.region;

                DataAdapters.apply_to_variant_types([d.data], function(type_data, memo, location_data) {
                    var coordinate = location_data.coordinate,
                        stem_start_x = region.layout.get_screen_location_for_coordinate(coordinate, ctx),
                        stem_end_x = variant_layout.getScreenLocationForVariant(coordinate, type_data) + viewport_x;

                    stem_rendering_data.push({
                        sx: stem_start_x,
                        sy: self.dimensions.height,
                        tx: stem_end_x,
                        ty: self.dimensions.height - self.config.stem_height,
                        coordinate: coordinate
                    });
                });
            });

            this.render_data.stems = stem_rendering_data;
        },

        getVariantLayout: function() {
            return this.config.variant_layout;
        },

        //////////////
        // Data API //
        //////////////
        data: function(data, data_key) {
            this._applyStackedBarRenderData(data);
            this.location_data = data;

            return this;
        },

        regions: function(region_data, param_coordinate_getter) {
            this.region_data = region_data;

            return this;
        },

        color_scheme: function(color_scheme) {
            this.config.color_scheme = color_scheme;

            return this;
        },

        height: function(height) {
            this.dimensions = {
                height: height
            };

            return this;
        },

        bar_width: function(value) {
            this.config.bar_width = value;

            return this;
        },

        stem_height: function(height) {
            this.config.stem_height = height;

            return this;
        },

        variant_layout: function(layout_object) {
            this.config.variant_layout = layout_object;

            return this;
        },

        //////////////////////////////////
        // Internal rendering functions //
        //////////////////////////////////
        _renderBars: function() {
            var self = this,
                ctx = this._getRenderingContext();

            ctx.svg
                .selectAll(".variant")
                .remove();

            ctx.svg
                .selectAll(".variant")
                .data(self.render_data.bars)
                .enter()
                    .append("svg:rect")
                    .attr("class", "variant")
                    .attr("x", function(d) {
                        return d.screen_x;
                    })
                    .attr("y", function(d) {
                        return d.y;
                    })
                    .attr("width", self.config.bar_width)
                    .attr("height", function(d) {
                        return d.height;
                    })
                    .style("fill", function(d) {
                        return d.color;
                    });
        },

        _renderStems: function() {
            var ctx = this._getRenderingContext();

            var diagonal = d3.svg.diagonal()
                .projection(function(d) {
                    return [d.x, d.y];
                })
                .source(function(d) {
                    return {
                        x: d.sx,
                        y: d.sy
                    };
                })
                .target(function(d) {
                    return {
                        x: d.tx,
                        y: d.ty
                    };
                });

            ctx.svg
                .selectAll(".stem")
                .remove();

            ctx.svg.selectAll(".stem")
                .data(this.render_data.stems)
                .enter()
                .append("svg:path")
                .attr("class", "stem")
                .style("fill", "none")
                .style("stroke", "gray")
                .attr("d", diagonal);
        },

        ///////////////////
        // Rendering API //
        ///////////////////
        draw: function() {
            this.render();
        },

        render: function() {
            this._updateVisibleData();

            this._buildStemRenderData();
            this._renderStems();

            this._buildBarRenderData();
            this._renderBars();
        }
    };

    return {
        create: function(config) {
            var track = Object.create(BarPlotTrackPrototype, {});
            track.config = {};
            track.render_data = {};
            return track;
        }
    }
});
