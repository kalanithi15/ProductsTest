var Product = Product || {};

var downloadCount =0;

Product.property ={
  "productResponse":{},
  "productCallback":{},
  "productIssueResponse":{},
  "IsProducts":false,
  "productSerialNo":0,
  "productIssueSerialNo":0,
  "productTotalCount":0,
  "productIssueTotalCount":0,
  "productMaxCount": 20000,
  "applyFilter": false,
  "productTimeStamp":"",
  "productIssueTimeStamp":""
}

/*
 * Business Object
 * 
 */
Product.bo = {

  getProducts: function(){
      kprint(" :: Products ::  >> Time when getProducts called ############## ", formatDate(new Date(),4));
      mUtil.getFreeMemory();
	 //if (AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") && ipf.net.connectivityExists() && ipf.net.isServerReachable(UnlockPIN.api.getMiddlewareURL(), 5)) {
	 if (AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") && ipf.net.connectivityExists()) {
		
			 var inputParams = {};
		     var ipfheaders = ipf.headerParam.getHeader("getProductsAndIssue");
		     kprint(kony.store.getItem("PR_OFFSET_COUNT")," getProducts Products offset");
		     //var newOffset = kony.store.getItem("PR_OFFSET_COUNT");
		     Product.property.productSerialNo = mUtil.emptyCheckForString(kony.store.getItem("PR_OFFSET_COUNT")) ? parseInt(kony.store.getItem("PR_OFFSET_COUNT"))+1 : 0;
		     kprint(kony.store.getItem("PR_OFFSET_COUNT")," getProducts Products offset after");
		     kprint(Product.property.productSerialNo," getProducts Products sno offset after");
		     kprint("header for getProducts====>"+JSON.stringify(ipfheaders)," Header Params")
		     gblTimestamp = ipfheaders["X-Timestamp"];
	         gblMessageId = ipfheaders["X-Message-Id"];
		     inputParams["httpheaders"] = ipfheaders;
		     inputParams["serviceID"] = "getProducts";
		     inputParams["isMySalesExclusion"] = Product.property.applyFilter;
		     inputParams["serverTimestamp"] = Number(Product.property.productTimeStamp).toFixed(0);
		     inputParams["batchOffset"] = Number(Product.property.productSerialNo).toFixed(0);
		     inputParams["batchCount"] = Number(Product.property.productMaxCount).toFixed(0);
		     inputParams["serviceName"] = "getProducts";
		 	 appConfig.secureurl = "https://" + AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") + ":" + AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_PORT") + "/middleware/MWServlet";
			 kprint(inputParams," inputparams Products ");	 	
		 	 ipfappmiddlewaresecureinvokerasync(inputParams, Product.bo.getProductsServiceCallback);
	 	 
	 }else{
	 	kprint(" :: Products :: ", "getProducts No Connectivity"); //continue further
		Product.dao.isProductsAvailable();
	 }
  },
  
  getProductsServiceCallback: function(status,response){
   		kprint(" :: Products :: >> Time when getProductsServiceCallback called############## ", formatDate(new Date(),4));
        if (status === 400) {
        	kprint("", "getProductsServiceCallback response received");
            if (response.opstatus !== undefined && response.opstatus === 0) {
                if(response['errorCode'].toString() === "42000") {
            	// code to delete the existing product records
					com.kony.MyCollections.ReferenceData.Products.removeDeviceInstance("",Product.bo.removeProductsSCB, Product.dao.anyDatabaseFailure);
           		}
           		else{
                mNewRelic.sendNREvent("getProductsServiceCallback", "MW", gblMessageId, gblTimestamp, "", "Products.v1/Service.svc/products?lastUpdatedVersion="+ AppCustomAttributes.api.getCustAttrValue("PR_SERVER_TIMESTAMP"), "Product", "0", "", "Products And issues Successfully downloaded");
                app.log.info("", mUtil.getDeviceId(),"PRODUCTS002 getProductsServiceCallback  "+response.opstatus, "");
				kprint("  :: Products :: ", "getProductsServiceCallback response received");
				Product.property.productResponse = response;
				Product.property.IsProducts = true;
				if(Product.bo.isResponseValid(response)){
				   if(Product.property.productSerialNo === 0){
				   		kprint(Product.property.productSerialNo,"Clear and save products");
				   		Product.dao.clearAndSaveProducts();
				   }else{
				   		kprint(Product.property.productSerialNo,"save products");
				   		Product.dao.saveProducts();
				   }
				}
              } 
            }
            else {
                app.log.info("", mUtil.getDeviceId(), "PRODUCTS003 getProductsServiceCallback opstatus not 0, opstatus :  " + +response.opstatus, "");
                mNewRelic.sendNREvent("getProducts", "MW", gblMessageId, gblTimestamp, "", "Products.v1/Service.svc/products?lastUpdatedVersion="+ AppCustomAttributes.api.getCustAttrValue("PR_SERVER_TIMESTAMP"), "Login", JSON.stringify(response), "MW call returned error", "Products And issues Successfully downloaded");
           	    kprint("  :: Products :: ", "OpenAgain getProductsServiceCallback response error");
           	}
        }
  },
  removeProductsSCB : function(response)
  {
  	kprint("  :: Products :: >> Time when removeProductsSCB called ############## ", formatDate(new Date(),4));
  	kprint(JSON.stringify(response),'removeProductsSCB::Inside remove products SCB')
  	kony.store.setItem("PR_OFFSET_COUNT",0);
  	//Product.property.productTimeStamp = "";
	com.kony.MyCollections.Store.IPFStore.updateByPK('PR_SERVER_TIMESTAMP', {
                "description": -1
            }, Product.bo.callProducts, Product.dao.anyDatabaseFailure);
  },
  callProducts: function(){
	kprint("  :: Products :: >> Time when callProducts called ############## ", formatDate(new Date(),4));
	Product.bo.getProducts();
  },
  
  
  downloadProducts: function(callBack){
  		kprint("  :: Products :: >> Time when downloadProducts called ############## ", formatDate(new Date(),4));
  		Product.property.productCallback = callBack;//to call once the products is downloaded
  		Product.bo.getProducts();
  },
  
  
  getProductIssue: function(){
      kprint(" :: Products :: >> Time when getProductIssue called ############## ", formatDate(new Date(),4));
      mUtil.getFreeMemory();
	 //if (AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") && ipf.net.connectivityExists() && ipf.net.isServerReachable(UnlockPIN.api.getMiddlewareURL(), 5)) {
	 kprint(Product.property.productTimeStamp, "ProdStamp");
	 kprint(Product.property.productIssueTimeStamp,"PIStamp");
	 if(Product.bo.isProductsDownLoaded()){

	 	kony.store.setItem("PR_OFFSET_COUNT",0);
	 	kony.store.setItem("PR_TOTAL_COUNT",0);
		if (AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") && ipf.net.connectivityExists()) {
			 
		  		 var inputParams = {};
				 var ipfheaders = ipf.headerParam.getHeader("getProductsAndIssue");
				 Product.property.productIssueSerialNo = mUtil.emptyCheckForString(kony.store.getItem("PRI_OFFSET_COUNT")) ? parseInt(kony.store.getItem("PRI_OFFSET_COUNT"))+1 : 0;
				 gblTimestamp = ipfheaders["X-Timestamp"];
				 gblMessageId = ipfheaders["X-Message-Id"];
				 inputParams["httpheaders"] = ipfheaders;
				 inputParams["serviceID"] = "getProductIssues";
				 inputParams["isMySalesExclusion"] = Product.property.applyFilter;
				 inputParams["serverTimestamp"] = Number(Product.property.productIssueTimeStamp).toFixed(0);
				 kprint('after setting pri --- ');
				 inputParams["batchOffset"] = Number(Product.property.productIssueSerialNo).toFixed(0);
				 inputParams["batchCount"] =  Number(Product.property.productMaxCount).toFixed(0);
				 inputParams["downloadCount"] = Number(downloadCount).toFixed(0);
				 inputParams["serviceName"] = "getProductIssues";
				 appConfig.secureurl = "https://" + AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_HOST") + ":" + AppCustomAttributes.api.getCustAttrValue("MIG_MW_SERVER_PORT") + "/middleware/MWServlet";
				 kprint(inputParams, 'inputParams for getProductsAndIssue -- ');
				 ipfappmiddlewaresecureinvokerasync(inputParams, Product.bo.getProductIssueServiceCallback);
		    	 
		 }else{
		 	 kprint(" :: Product :: ", "OpenAgain getProductIssue No Connectivity");
		 }
	 }
	 else
	 {
	 	Product.bo.getProducts();
	 }	
	 
  },
  
  
  getProductIssueServiceCallback: function(status,response){
   		kprint(" :: Product :: >> Time when getProductIssueServiceCallback called############## ", formatDate(new Date(),4));
   		try{
        if (status === 400) {
            if (response.opstatus !== undefined && response.opstatus === 0) {
               // kprint(response.length, "getProductIssueServiceCallback response ");
                if(response['errorCode'].toString() === "42000") {
            	// code to delete the existing product issue records
					com.kony.MyCollections.ReferenceData.Products.removeDeviceInstance("",Product.bo.removeProductIssuesSCB, Product.dao.anyDatabaseFailure);
            	}else
            	{
	                mNewRelic.sendNREvent("getProductIssueServiceCallback", "MW", gblMessageId, gblTimestamp, "", "Products.v1/Service.svc/productIssues?lastUpdatedVersion="+ AppCustomAttributes.api.getCustAttrValue("PRI_SERVER_TIMESTAMP"), "Product", "0", "", "Products And issues Successfully downloaded");
	                app.log.info("", mUtil.getDeviceId(),"PRODUCTS002 getProductIssueServiceCallback  "+response.opstatus, "");
					Product.property.productIssueResponse = response;
					Product.property.IsProducts = false;
					if(Product.bo.isResponseValid(response)){
						downloadCount = downloadCount+1;
					   Product.dao.saveProducts();
					}
			    }
            } 
            else {
                app.log.info("", mUtil.getDeviceId(), "PRODUCTS003 getProductIssueServiceCallback opstatus not 0, opstatus :  " + +response.opstatus, "");
                mNewRelic.sendNREvent("getProducts", "MW", gblMessageId, gblTimestamp, "", "Products.v1/Service.svc/products?lastUpdatedVersion="+ AppCustomAttributes.api.getCustAttrValue("PRI_SERVER_TIMESTAMP"), "Login", JSON.stringify(response), "MW call returned error", "Products And issues Successfully downloaded");
           	    kprint(" :: Product :: ", "OpenAgain getProductIssueServiceCallback Service response error");
           	}
        }
        }catch(ex){
        	alert(ex.message);
        }
  },
  removeProductIssuesSCB : function()
  {
  	kprint("  :: Products :: >> Time when removeProductIssuesSCB called ############## ", formatDate(new Date(),4));
  	kony.store.setItem("PRI_OFFSET_COUNT",0);
  	//Product.property.productIssueTimeStamp = "";
	com.kony.MyCollections.Store.IPFStore.updateByPK('PR_SERVER_TIMESTAMP', {
                "description": -1
            }, Product.bo.callProductIssues, Product.dao.anyDatabaseFailure);
  },
  callProductIssues: function(){
	kprint("  :: Products :: >> Time when callProducts called ############## ", formatDate(new Date(),4));
	Product.bo.getProductIssue();
  },
  isResponseValid: function(response){
  	kprint("  :: Products :: >> Time when isResponseValid called ############## ", formatDate(new Date(),4));
  		if(mUtil.isEmptyCheck(response["errorCode"])||mUtil.isEmptyCheck(response["errorType"])||mUtil.isEmptyCheck(response["errorMessage"])){
  			return false;
  		}else{
  			return true;
  		}
  },
  isProductsDownLoaded: function(){
  	kprint("  :: Products :: >> Time when isProductsDownLoaded called ############## ", formatDate(new Date(),4));
  	kprint("isProductsDownLoaded::PR OFFSET ", kony.store.getItem("PR_OFFSET_COUNT"));
  	kprint("isProductsDownLoaded::PR TOTAL ", kony.store.getItem("PR_TOTAL_COUNT"));
  	if(kony.store.getItem("PR_OFFSET_COUNT") < kony.store.getItem("PR_TOTAL_COUNT")){
  		return false;
  	}

  	return true;
  },
  
  isProductIssueDownLoaded: function(){
  	kprint("  :: Products :: >> Time when isProductIssueDownLoaded called ############## ", formatDate(new Date(),4));
   	kprint("isProductIssueDownLoaded::PRI OFFSET ", kony.store.getItem("PRI_OFFSET_COUNT") );
  	kprint("isProductIssueDownLoaded::PRI TOTAL ", kony.store.getItem("PRI_TOTAL_COUNT") );
	 if(kony.store.getItem("PRI_OFFSET_COUNT") < kony.store.getItem("PRI_TOTAL_COUNT")){
  		return false;
  	}
	  	return true;
    }
  
  }

/*
 * Data access object
 * 
 */
Product.dao = {
  anyDatabaseFailure: function(error){
  	 kprint(" :: Product :: >> Time when anyDatabaseFailure called############## ", formatDate(new Date(),4));
 	 },
  
  clearAndSaveProducts: function(){
		kprint(" :: Product :: >> Time when clearAndSaveProducts called############## ", formatDate(new Date(),4));
   var productsRemovedSCB = function(){
   		com.kony.MyCollections.ReferenceData.ProductIssues.removeDeviceInstance("",Product.dao.saveProducts,Product.dao.anyDatabaseFailure );
   };
   com.kony.MyCollections.ReferenceData.Products.removeDeviceInstance("",productsRemovedSCB, Product.dao.anyDatabaseFailure);
  },

  saveProducts: function(){
    kprint(" :: Product :: >> Time when saveProducts called############## ", formatDate(new Date(),4));
    var dbname = kony.sync.getDBName();
  	var connection = kony.sync.getConnectionOnly(dbname, dbname);
	kony.sync.startTransaction(connection, Product.property.IsProducts ? Product.dao.bulkProductInsertCB : Product.dao.bulkProductIssueInsertCB , Product.dao.saveProductsTransactionSCB, Product.dao.anyDatabaseFailure);
  },
  
  bulkProductInsertCB: function(tx){
  		kprint(" :: Product :: >> Time when bulkProductInsertCB called############## ", formatDate(new Date(),4));
		var jsonArray =  mUtil.sortArrayInteger(Product.property.productResponse["Products"],"serialNo");
		//var jsonArray =  Product.property.productResponse["Products"];
		Product.property.productTimeStamp = Product.property.productResponse["serverTimestamp"];
		Product.property.productTotalCount = parseInt(Product.property.productResponse["totalCount"]);
		var jsonlen = jsonArray.length;
		for(var i = 0; i < jsonlen ; i++){
			Product.property.productSerialNo = parseInt(jsonArray[i].serialNo);
			//valuestring = '"+jsonArray[i].productId+"','"+jsonArray[i].term+"','"+jsonArray[i].termType+"','"+jsonArray[i].startDate+"','"+jsonArray[i].endDate+"','"+Product.property.productSerialNo+"','"+Product.property.productTimeStamp+"','"+Product.property.productTotalCount+"','"+JSON.stringify(jsonArray[i].features)+"')" +,()
			var strSQL = "INSERT INTO Products (productId,term,termType,startDate,endDate,serialNo,serverTimestamp,totalCount,features) VALUES('"+jsonArray[i].productId+"','"+jsonArray[i].term+"','"+jsonArray[i].termType+"','"+jsonArray[i].startDate+"','"+jsonArray[i].endDate+"','"+Product.property.productSerialNo+"','"+Product.property.productTimeStamp+"','"+Product.property.productTotalCount+"','"+JSON.stringify(jsonArray[i].features)+"')";
			var resultset = kony.sync.executeSql(tx,strSQL,null);	
			if(resultset===false){
				kony.print("-----resultset false");
			}
		}
  },
  
   bulkProductIssueInsertCB: function(tx){
  		kprint(" :: Product :: >> Time when bulkProductIssueInsertCB called############## ", formatDate(new Date(),4));
		var jsonArray = mUtil.sortArrayInteger(Product.property.productIssueResponse["ProductIssue"],"serialNo");
		//var jsonArray = Product.property.productIssueResponse["response"]["productIssues"];
		var jsonlen = jsonArray.length;
		kprint(Product.property.productIssueTimeStamp ,"productIssueTimeStamp before")
		Product.property.productIssueTimeStamp = Product.property.productIssueResponse["response"]["serverTimestamp"];
		kprint(Product.property.productIssueTimeStamp ,"productIssueTimeStamp after")
		Product.property.productIssueTotalCount = parseInt(Product.property.productIssueResponse["response"]["totalCount"]);
		for(var i = 0; i < jsonlen ; i++){
			Product.property.productIssueSerialNo = parseInt(jsonArray[i].serialNo);
			var strSQL = "INSERT INTO ProductIssues (productId,issueValue,regularInstallment,serialNo,totalCount,serverTimestamp,financialParameters) VALUES('"+jsonArray[i].productId+"','"+parseFloat(jsonArray[i].issueValue)+"','"+parseFloat(jsonArray[i].regularInstallment)+"','"+Product.property.productIssueSerialNo+"','"+Product.property.productIssueTotalCount+"','"+Product.property.productIssueTimeStamp+"','"+JSON.stringify(jsonArray[i])+"')";
			var resultset = kony.sync.executeSql(tx,strSQL,null);	
			if(resultset===false){
				kony.print("-----resultset false");
			}
		}
  },
  
  saveProductsTransactionSCB: function(){
  	kprint(" :: Product :: >> Time when saveProductsTransactionSCB called############## ", formatDate(new Date(),4));
  	if(!Product.property.IsProducts){ //Comes from ProductIssue
		kony.store.setItem("PRI_OFFSET_COUNT",Product.property.productIssueSerialNo);
        kony.store.setItem("PRI_TOTAL_COUNT",Product.property.productIssueTotalCount);
        kprint(Product.property.productIssueSerialNo," saveProductsTransactionSCB Product issues");
        
        Product.dao.updateServerTimeStamp();
  		/* if(Product.bo.isProductIssueDownLoaded()){
  			Product.dao.updateServerTimeStamp();//download
  		}else{
  			Product.bo.getProductIssue();
  		} */
  	}else{//Comes from Product

		kony.store.setItem("PR_OFFSET_COUNT",Product.property.productSerialNo);
		kony.store.setItem("PR_TOTAL_COUNT",Product.property.productTotalCount);
		kprint(Product.property.productSerialNo," saveProductsTransactionSCB Products");
		kprint(kony.store.getItem("PR_OFFSET_COUNT")," saveProductsTransactionSCB Products offset");
		Product.dao.updateServerTimeStamp();
  		/* if(Product.bo.isProductsDownLoaded()){
  			//Update ServerTimeStamp and get ProductIssue
  			Product.dao.updateServerTimeStamp();//download
  		}else{
  			Product.bo.getProducts();//dont download
  		} */
  	}
  },
  
  updateServerTimeStamp: function(){
    kprint(" :: Product :: >> Time when updateServerTimeStamp called############## ", formatDate(new Date(),4));
    if(Product.property.IsProducts){
        //kony.store.setItem("PR_OFFSET_COUNT",0);
		kprint(Product.property.productTimeStamp ,"productTimeStamp to update")
		kprint(AppCustomAttributes.api.getCustAttrValue("PR_SERVER_TIMESTAMP") ,"productTimeStamp before to update")
   		com.kony.MyCollections.Store.IPFStore.updateByPK('PR_SERVER_TIMESTAMP', {
                    "description": Product.property.productTimeStamp
                }, Product.dao.updatedPRServerTimeSCB, Product.dao.anyDatabaseFailure);
    }else{
    	//kony.store.setItem("PRI_OFFSET_COUNT",0);
		kprint(Product.property.productIssueTimeStamp ,"productIssueTimeStamp to update")
		kprint(AppCustomAttributes.api.getCustAttrValue("PRI_SERVER_TIMESTAMP") ,"productIssueTimeStamp before to update")
    	com.kony.MyCollections.Store.IPFStore.updateByPK('PRI_SERVER_TIMESTAMP', {
                    "description": Product.property.productIssueTimeStamp
                }, Product.dao.updatedPRIServerTimeSCB, Product.dao.anyDatabaseFailure);
    }
  },
  updatedPRServerTimeSCB : function(response){
  	kprint(response,"PR time updated response ")
	//kprint(AppCustomAttributes.api.getCustAttrValue("PR_SERVER_TIMESTAMP") ,"productTimeStamp inside update SCB")
	  var getStoreQuery_Success = function(response)
	  {
	  	kprint(response, 'getStoreQuery_Success  getUpdatedServerTimestamp');
        app.log.error("", mUtil.getDeviceId(), "MCCUSTOM07 : Retrieving custom attributes from device DB Failed ", "");
        Product.property.productTimeStamp = response[0]['description'];
        Product.bo.getProductIssue();
      
	  }
      var getStoreQuery_Failure = function(error) {
        kprint(error, 'getStoreQuery_Failure');
        app.log.error("", mUtil.getDeviceId(), "MCCUSTOM07 : Retrieving custom attributes from device DB Failed ", "");
        //AppCustomAttributes.api.showNoCAPopup();
      };
      var query = "SELECT key,description from IPFStore where key = 'PR_SERVER_TIMESTAMP'";
      ipf.sync.single_select_execute(ipf.sync.getDBName(), query, null, getStoreQuery_Success, getStoreQuery_Failure);
  },

  updatedPRIServerTimeSCB : function(response){
  	kprint(response,"PRI time updated response ")
  	 var getStoreQuery_Success = function(response)
	  {
	  	kprint(response, 'getStoreQuery_Success  getUpdatedServerTimestamp');
        app.log.error("", mUtil.getDeviceId(), "MCCUSTOM07 : Retrieving custom attributes from device DB Failed ", "");
        Product.property.productIssueTimeStamp = response[0]['description'];
        Product.dao.toCallProductIssue();
	  }
      var getStoreQuery_Failure = function(error) {
        kprint(error, 'getStoreQuery_Failure');
        app.log.error("", mUtil.getDeviceId(), "MCCUSTOM07 : Retrieving custom attributes from device DB Failed ", "");
        //AppCustomAttributes.api.showNoCAPopup();
      };
      var query = "SELECT key,description from IPFStore where key = 'PRI_SERVER_TIMESTAMP'";
      ipf.sync.single_select_execute(ipf.sync.getDBName(), query, null, getStoreQuery_Success, getStoreQuery_Failure);
  },
  toCallProductIssue : function(){
   	//AppCustomAttributes.api.getCustomAttrsfromDB();
	if(Product.bo.isProductIssueDownLoaded()){
		kprint("product issue downloaded")
	//Product.dao.updateServerTimeStamp();//download
		kony.store.setItem("PRI_OFFSET_COUNT",0);
	 	kony.store.setItem("PRI_TOTAL_COUNT",0);
		Product.property.productCallback();
	}else{
		kprint("product issue not downloaded")
		kprint(AppCustomAttributes.api.getCustAttrValue("PRI_SERVER_TIMESTAMP") ,"productIssueTimeStamp before to update")
		Product.bo.getProductIssue();
	} 
  },
  
  deleteExpiredProducts: function(){
  	kprint(" :: Product :: >> Time when deleteExpiredProducts called############## ", formatDate(new Date(),4));
  	var deviceDate = new Date().toISOString();
    var productIssuesRemovedSCB = function(){
    	var productsRemovedSCB = function(){
    		var productRolewhere = "DELETE FROM ProductRole WHERE endDate < '"+deviceDate+"'";
    		ipf.sync.single_select_execute(ipf.sync.getDBName(), productRolewhere, null, Product.property.productCallback,Product.dao.anyDatabaseFailure);
  			//com.kony.MyCollections.ReferenceData.ProductRole.removeDeviceInstance(productRolewhere,Product.property.productCallback, Product.dao.anyDatabaseFailure);
  		};
  		var productwhere = "DELETE FROM Products WHERE endDate < '"+deviceDate+"'";
  		ipf.sync.single_select_execute(ipf.sync.getDBName(), productwhere, null, productsRemovedSCB,Product.dao.anyDatabaseFailure);
    	//com.kony.MyCollections.ReferenceData.Products.removeDeviceInstance(productwhere,productsRemovedSCB, Product.dao.anyDatabaseFailure);
    };
  
  	var productIssuewhere = "DELETE FROM ProductIssues WHERE productId in (SELECT productId from Products WHERE endDate < '"+deviceDate+"')";
  	ipf.sync.single_select_execute(ipf.sync.getDBName(), productIssuewhere, null, productIssuesRemovedSCB,Product.dao.anyDatabaseFailure);
  	//com.kony.MyCollections.ReferenceData.ProductIssues.removeDeviceInstance("",productIssuesRemovedSCB, Product.dao.anyDatabaseFailure);
  },
  
  isProductAvailableSCB: function(response){
  	kprint(" :: Product :: >> Time when isProductAvailableSCB called############## ", formatDate(new Date(),4));
  	  if (mUtil.isEmptyCheck(response) && reponse["products"] === 'true' && reponse["productissues"] === 'true'){
             Product.property.productCallback();
      }else{
      		Product.dao.anyDatabaseFailure();
      }
  },
  
  isProductsAvailable: function(){
 	  kprint(" :: Product :: >> Time when isProductsAvailable called############## ", formatDate(new Date(),4));
      var query = "SELECT (SELECT case when cast(serialNo as NUMERIC) = cast(totalCount as NUMERIC) then 'true' else 'false' end ) FROM Products order by serialNo Desc Limit 1 ) as products ,( SELECT case when cast(serialNo as NUMERIC) = cast(totalCount as NUMERIC) then 'true' else 'false' end ) FROM ProductIssues order by serialNo Desc Limit 1) as productissues";
      kprint("isProductsAvailable::query: ", query);
      ipf.sync.single_select_execute(ipf.sync.getDBName(), query, null, Product.dao.isProductAvailableSCB,Product.dao.anyDatabaseFailure);
  		
  }
}