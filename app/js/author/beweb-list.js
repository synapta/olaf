
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

template = `
<tr id='{{id_beweb}}'>
    <td class="ui center aligned">
        <div class="ui inline loader"></div>

        <div class="ui button scarta-icon-button" data-info='{{{json}}}' tabindex="0">
            <div class="hidden content">Scarta</div>
        </div>
        <a target="_blank" href="/get/beweb/author/{{id_beweb}}">
            <div class="ui button">Vai a OLAF</div>
            </div>
        </a>
    </td>
    <td>{{id_beweb}}</a></td>
    <td>{{nome_visualizzazione}}</td>
    <!--<td><a target="_blank" href="{{{wikidata}}}">{{wikidata_short}}</a></td>-->
    <td>{{data_inserimento}}</td>
    <td>{{data_ultima_modifica_su_beweb}}</td>
    <td>{{numero_campi_modificati}}</td>
    <td>{{data_primo_cambiamento}}</td>
    <td class="differenze-column">
        <div class="ui accordion">
            <div class="title">
                <i class="icon dropdown"></i>
                Visualizza Modifiche
            </div>
            <div class="content">
                <table class="ui definition table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Vecchio</th>
                            <th>Nuovo</th>
                        </tr>
                    </thead>
                    <tbody>
                    {{#differenze}}
                        <tr> 
                            <td><b>{{nome}}</b></td>
                            <td>{{originale}}</td>
                            <td>{{modificato}}</td>
                        </tr>
                    {{/differenze}}
                    </tbody>
                </table>
            </div>
        </div>
    </td>
</tr>`;

// Get author, render author card, options and author labels
$(document).ready(() => {
    // Load alternative scripts
    //$('.big-table').tablesort()
        // Render navbar
    renderNavbar();
    // Load author list
    $.get(`/api/v1/${params.userToken}/author-list/`, (data) => {
        $("#loader").hide();
        let output = '';
        data.forEach(element => {
            element.wikidata_short = element.wikidata.split("/").pop();
            element.data_inserimento = element.data_inserimento.split('T')[0]
            element.data_primo_cambiamento = element.data_primo_cambiamento.split('T')[0]
            element.data_ultima_modifica_su_beweb = element.data_ultima_modifica_su_beweb ? element.data_ultima_modifica_su_beweb.split('T')[0] : ''

            element.json = JSON.stringify(element);
            output += Mustache.render(template, element);
        });
        $( "tbody" ).html(output);

        $('.ui.accordion').each(function(i){
            $(this).accordion({ exclusive: false});
        });

        $(".scarta-icon-button").each(function() {
            var $this = $(this);



            $this.on("click", function() {
                $this.hide();
                $this.closest('td').find('.loader').toggleClass('active')
                let info = $(this).data('info');
                let id = info.id_beweb
                info.Idrecord = info.id_beweb;
                info.Visualizzazione_su_BEWEB = info.nome_visualizzazione;
                info.Wikidata = info.wikidata;

                $.ajax({
                    type: "POST",
                    url: `/api/v1/${params.userToken}/add-author-again`,
                    data: info,
                    success: function(data){ 
                        console.log(id)
                        $("#" + id).remove();
                    }
                });
            });
        });
    });
});
