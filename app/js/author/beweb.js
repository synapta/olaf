function authorSkip(authorUri) {
    return null;
}

function authorSend(){

    // Render confirmation box and then submit the form
    if(confirm("Confermi di voler inviare i dati?")){
        $.ajax({
            type: 'POST',
            url: '/api/v1/' + params.userToken + '/enrich-beweb-author/' + author.uri,
            data: $('#matches-form').serialize(),
            success: (data) => {
                showResultMessage(data);
            },
            error: (data) => {
                showResultMessage(data);
            }
        })
    }

}