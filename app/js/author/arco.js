// Validate agent
function validateAgent(el) {

    // Store option dataset
    let dataset = $(el).closest('.author-option').data();
    $.ajax({
        type: 'POST',
        url: '/api/v1/' + params.userToken + '/validate-matching/' + encodeURIComponent(author.uri),
        data: {
            option: JSON.stringify(dataset.item)
        },
        async: true,
        success: (data) => {
            //window.location = '/get/' + params.userToken + '/author'
            alert('Validated matching');
        }
    })

}