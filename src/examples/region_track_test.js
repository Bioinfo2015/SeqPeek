define   (
[
    'examples/testutils',
    'examples/seqpeek_test',
    'util/data_adapters',
    'util/gene_region_utils',
    'util/region_layouts',
    'seqpeek_context',
    'region_scale_track'
],
function (
    TestUtils,
    SeqPeekTestPrototype,
    DataAdapters,
    GeneRegionUtils,
    RegionLayouts,
    SeqPeekContextFactory,
    RegionTrackFactory
) {
    var generate_region = function(transcript, type, start, end) {
        return {
            type: type,
            start: start,
            end: end
        }
    };

    var test_function = function(target_el) {
        var regions = _.map([
            ['TEST', 'noncoding', 500, 899],
            ['TEST', 'exon', 900, 2000],
            ['TEST', 'noncoding', 2001, 5999],
            ['TEST', 'exon', 6000, 6200]
        ], function(p) {
            return generate_region.apply(this, p);
        });

        var region_layout = RegionLayouts.BasicLayoutFactory
            .create({});

        var region_data = GeneRegionUtils.buildRegionsFromArray(regions);
        region_layout.process(region_data);

        var region_track = RegionTrackFactory.create({
            data: region_data,
            dimensions: {
                height: 30
            }
        });

        var spctx = SeqPeekContextFactory.create(target_el);
        spctx
            .width(1300)
            .scroll_handler(function(event) {
                this._updateViewportTranslation(event.translate);
            })
            .track(region_track)
            .draw();
    };

    var test_obj = Object.create(SeqPeekTestPrototype, {});
    test_obj.title = "Region rendering test";
    test_obj.description = "Add description here...";
    test_obj.height = 150;
    test_obj.test_function = test_function;

    return test_obj;
});