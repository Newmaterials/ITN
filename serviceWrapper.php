<?php
	$service = .($_GET['service']);

	/*if($service == "months"){
		*/
		$urlWithSearchTerm = "http://www.bcard.net/services/itninttools.asmx/FetchStats?";	
	
	/*}
	else {
		$urlWithSearchTerm = "http://www.bcard.net/services/itninttools.asmx/CurrentCount?";
	}
	*/
	

	
	/* gets the data from a URL */
	function get_data($url) {
	  $ch = curl_init();
	  $timeout = 5;
	  curl_setopt($ch, CURLOPT_URL, $url);
	  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	  curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
	  $data = curl_exec($ch);
	  curl_close($ch);
	  return $data;
	}

	// Go get the URL and then display its results
	echo get_data($urlWithSearchTerm);
?>